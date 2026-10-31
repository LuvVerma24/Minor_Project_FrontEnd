import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeServerStatus } from '../api/client';
import { authApi } from '../api/authApi';

const ServerStatusContext = createContext();

export const ServerStatusProvider = ({ children }) => {
  const [isSlowResponse, setIsSlowResponse] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'healthy' | 'checking' | 'sleeping'

  useEffect(() => {
    // Subscribe to axios 3-second threshold trigger
    const unsubscribe = subscribeServerStatus((slow) => {
      setIsSlowResponse(slow);
    });

    // Proactive background ping on initial load to wake up Render server
    const pingServer = async () => {
      try {
        await authApi.checkHealth();
        setServerStatus('healthy');
      } catch (err) {
        console.warn('Initial server ping notice:', err.message);
        setServerStatus('sleeping');
      }
    };

    pingServer();

    return () => unsubscribe();
  }, []);

  return (
    <ServerStatusContext.Provider value={{ isSlowResponse, serverStatus }}>
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider');
  }
  return context;
};
