import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

// Helper to read initial authentication state
// Prioritizes tab-isolated sessionStorage so each browser tab preserves its own user/session.
// Falls back to localStorage only when opening a brand-new tab.
const getInitialAuth = () => {
  try {
    const sessionToken = sessionStorage.getItem('academic_portal_token');
    const sessionUser = sessionStorage.getItem('academic_portal_user');
    if (sessionToken && sessionUser) {
      return { token: sessionToken, user: JSON.parse(sessionUser) };
    }

    const localToken = localStorage.getItem('academic_portal_token');
    const localUser = localStorage.getItem('academic_portal_user');
    if (localToken && localUser) {
      // Seed this tab's sessionStorage to isolate this tab going forward
      sessionStorage.setItem('academic_portal_token', localToken);
      sessionStorage.setItem('academic_portal_user', localUser);
      return { token: localToken, user: JSON.parse(localUser) };
    }
  } catch (err) {
    console.warn('Failed to read stored authentication data:', err);
  }
  return { token: null, user: null };
};

export const AuthProvider = ({ children }) => {
  const [initialState] = useState(getInitialAuth);
  const [user, setUser] = useState(initialState.user);
  const [token, setToken] = useState(initialState.token);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken =
        sessionStorage.getItem('academic_portal_token') ||
        localStorage.getItem('academic_portal_token');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res?.success && res.user) {
          setUser(res.user);
          sessionStorage.setItem('academic_portal_user', JSON.stringify(res.user));
          // Only sync to localStorage if this tab is the owner of the localStorage token
          if (localStorage.getItem('academic_portal_token') === storedToken) {
            localStorage.setItem('academic_portal_user', JSON.stringify(res.user));
          }
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const setAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      sessionStorage.setItem('academic_portal_token', newToken);
      localStorage.setItem('academic_portal_token', newToken);
    } else {
      sessionStorage.removeItem('academic_portal_token');
      localStorage.removeItem('academic_portal_token');
    }
    if (newUser) {
      sessionStorage.setItem('academic_portal_user', JSON.stringify(newUser));
      localStorage.setItem('academic_portal_user', JSON.stringify(newUser));
    } else {
      sessionStorage.removeItem('academic_portal_user');
      localStorage.removeItem('academic_portal_user');
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res?.token && res?.user) {
      setAuthData(res.token, res.user);
    }
    return res;
  };

  const logout = () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('academic_portal_token');
    sessionStorage.removeItem('academic_portal_user');
    if (localStorage.getItem('academic_portal_token') === currentToken) {
      localStorage.removeItem('academic_portal_token');
      localStorage.removeItem('academic_portal_user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('academic_portal_user', JSON.stringify(updatedUser));
    if (localStorage.getItem('academic_portal_token') === token) {
      localStorage.setItem('academic_portal_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        setAuthData,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
