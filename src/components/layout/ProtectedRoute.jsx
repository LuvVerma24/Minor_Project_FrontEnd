import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Spinner size="lg" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying institutional session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role is mismatch, redirect to appropriate dashboard
    const target = user.role === 'teacher' ? '/faculty' : '/student';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
