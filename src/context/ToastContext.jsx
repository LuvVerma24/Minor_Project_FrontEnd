import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    if (!message) return null;

    // Deduplicate: avoid piling up identical toast messages within active toasts
    setToasts((prev) => {
      const existing = prev.find((t) => t.message === message && t.type === type);
      if (existing) {
        return prev; // don't duplicate identical toast
      }
      const id = Date.now() + Math.random().toString(36).substring(2, 7);
      const newToast = { id, message, type };

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return [...prev.slice(-3), newToast]; // Keep at most 4 recent toasts
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration || 5000), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--status-danger-btn)', flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />}
            
            <div style={{ flex: 1, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.4 }}>
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="btn-ghost"
              style={{ padding: '2px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
