import apiClient from './client';

export const authApi = {
  // Signup Step 1: Initiate signup, send OTP
  initiateSignup: async (data) => {
    return apiClient.post('/auth/signup/initiate', data);
  },

  // Signup Step 2: Verify 6-digit OTP and create user
  verifySignup: async (data) => {
    return apiClient.post('/auth/signup/verify', data);
  },

  // Login: email and password
  login: async (data) => {
    return apiClient.post('/auth/login', data);
  },

  // Forgot Password Step 1: Request OTP for email
  forgotPasswordStep1: async (data) => {
    return apiClient.post('/auth/forgot-password/step1', data);
  },

  // Forgot Password Step 2: Verify OTP
  forgotPasswordStep2: async (data) => {
    return apiClient.post('/auth/forgot-password/step2', data);
  },

  // Forgot Password Step 3: Reset password with OTP + newPassword + confirmNewPassword
  forgotPasswordStep3: async (data) => {
    return apiClient.post('/auth/forgot-password/step3', data);
  },

  // Get current logged-in user details
  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  // Ping health check to pre-warm backend
  checkHealth: async () => {
    return apiClient.get('/health');
  },
};
