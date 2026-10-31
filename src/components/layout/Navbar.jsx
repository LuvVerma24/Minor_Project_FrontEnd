import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Sun, Moon, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

const Navbar = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, isTeacher, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/auth';
    return isTeacher ? '/faculty' : '/student';
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        {/* Brand */}
        <Link to={getDashboardLink()} className="brand-wrapper" title="Academic Portal Home">
          <div className="brand-icon">
            <GraduationCap size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Academic Portal</span>
            <span className="brand-subtitle">Faculty & Student System</span>
          </div>
        </Link>

        {/* Right Navigation Actions */}
        <div className="nav-actions">
          {/* Theme Toggle - Visible on EVERY page */}
          <Button
            id="theme-toggle-btn"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* Authenticated User Info & Logout */}
          {isAuthenticated && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <UserIcon size={15} style={{ color: 'var(--text-muted)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user.fullName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {user.department || (isTeacher ? user.post : `${user.year || ''} ${user.section || ''}`)}
                  </span>
                </div>
                <Badge variant={isTeacher ? 'accent' : 'neutral'} style={{ marginLeft: '0.25rem' }}>
                  {isTeacher ? 'Faculty' : 'Student'}
                </Badge>
              </div>

              <Button
                id="nav-logout-btn"
                variant="outline"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                title="Log out"
              >
                Logout
              </Button>
            </div>
          )}

          {!isAuthenticated && (
            <Link to="/auth">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
