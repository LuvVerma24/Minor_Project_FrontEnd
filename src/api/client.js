import axios from 'axios';

// Base URL configured via environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Cold-start & connection monitoring listeners
const statusListeners = new Set();
let isConnectingToServer = false;
let activeRequestsCount = 0;
let isFirstRequestCompleted = false;

export const subscribeServerStatus = (callback) => {
  statusListeners.add(callback);
  callback(isConnectingToServer);
  return () => statusListeners.delete(callback);
};

const notifyServerStatus = (status) => {
  if (isConnectingToServer !== status) {
    isConnectingToServer = status;
    statusListeners.forEach((listener) => listener(status));
  }
};

// Create main axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token and Dynamic Timeout
apiClient.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('academic_portal_token') ||
      localStorage.getItem('academic_portal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Dynamic timeout: 60s for cold-start / initial request, 15s thereafter
    if (!config.timeout) {
      config.timeout = !isFirstRequestCompleted ? 60000 : 15000;
    }

    // Start 3-second timer to detect slow response / server waking up
    activeRequestsCount++;
    const timerId = setTimeout(() => {
      if (activeRequestsCount > 0) {
        notifyServerStatus(true);
      }
    }, 3000);
    config._timerId = timerId;

    return config;
  },
  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      notifyServerStatus(false);
    }
    return Promise.reject(error);
  }
);

// Response Interceptor: Manage 3-sec timer, retry on timeout, handle 401 and extract error shapes
apiClient.interceptors.response.use(
  (response) => {
    isFirstRequestCompleted = true;
    if (response.config._timerId) {
      clearTimeout(response.config._timerId);
    }
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      notifyServerStatus(false);
    }
    return response.data;
  },
  async (error) => {
    const originalConfig = error.config || {};
    if (originalConfig._timerId) {
      clearTimeout(originalConfig._timerId);
    }
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      notifyServerStatus(false);
    }

    // Check if error is timeout or network failure and can be retried once
    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'));
    const isNetworkError = !error.response && !isTimeout;

    if ((isTimeout || isNetworkError) && !originalConfig._retry) {
      originalConfig._retry = true;
      originalConfig.baseURL = BASE_URL;
      originalConfig.timeout = 45000;
      notifyServerStatus(true);

      try {
        const token =
          sessionStorage.getItem('academic_portal_token') ||
          localStorage.getItem('academic_portal_token');
        const headers = {
          ...(originalConfig.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const retryRes = await axios({
          ...originalConfig,
          headers,
          baseURL: BASE_URL,
        });
        isFirstRequestCompleted = true;
        notifyServerStatus(false);
        return retryRes.data;
      } catch (retryError) {
        notifyServerStatus(false);
        const retryErrMsg =
          retryError.response?.data?.message ||
          (retryError.code === 'ECONNABORTED'
            ? 'Server connection timed out. The server may still be waking up.'
            : 'Unable to connect to the backend server. Please ensure the backend is running.');
        return Promise.reject(new Error(retryErrMsg));
      }
    }

    // Handle 401 Unauthorized: token expired or invalid
    if (error.response?.status === 401) {
      const currentToken =
        sessionStorage.getItem('academic_portal_token') ||
        localStorage.getItem('academic_portal_token');
      sessionStorage.removeItem('academic_portal_token');
      sessionStorage.removeItem('academic_portal_user');
      if (localStorage.getItem('academic_portal_token') === currentToken) {
        localStorage.removeItem('academic_portal_token');
        localStorage.removeItem('academic_portal_user');
      }
      // Trigger global event if not already on login
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    // Extract exact backend error message { success: false, message: "..." }
    const backendMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const enhancedError = new Error(backendMessage);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
