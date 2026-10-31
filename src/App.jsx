import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ServerStatusProvider } from './context/ServerStatusContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import ServerStatusBanner from './components/layout/ServerStatusBanner';
import ProtectedRoute from './components/layout/ProtectedRoute';

import AuthPage from './pages/auth/AuthPage';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ClassDashboard from './pages/faculty/ClassDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Root redirect handler
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={user.role === 'teacher' ? '/faculty' : '/student'} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ServerStatusProvider>
          <AuthProvider>
            <Router>
              <div className="app-layout">
                {/* Fixed Top Institutional Navbar */}
                <Navbar />

                {/* Cold-Start / Slow Connection Notification Banner */}
                <ServerStatusBanner />

                {/* Main Content Area */}
                <main className="main-content" role="main">
                  <Routes>
                    {/* Root Redirect */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Authentication Portal */}
                    <Route path="/auth" element={<AuthPage />} />

                    {/* Faculty Routes */}
                    <Route
                      path="/faculty"
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <FacultyDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/faculty/class/:classId"
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <ClassDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Student Routes */}
                    <Route
                      path="/student"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Catch-All */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            </Router>
          </AuthProvider>
        </ServerStatusProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
