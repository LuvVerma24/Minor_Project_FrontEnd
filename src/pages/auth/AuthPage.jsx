import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, BookOpen, UserCheck, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card, { CardBody } from '../../components/common/Card';
import SignupScreen1 from './SignupScreen1';
import SignupScreen2 from './SignupScreen2';
import ForgotPasswordModal from './ForgotPasswordModal';

const AuthPage = () => {
  const { login, setAuthData, isAuthenticated, isTeacher } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from
        ? `${location.state.from.pathname || ''}${location.state.from.search || ''}`
        : isTeacher
        ? '/faculty'
        : '/student';
      navigate(from || (isTeacher ? '/faculty' : '/student'), { replace: true });
    }
  }, [isAuthenticated, isTeacher, navigate, location]);

  // Auth Portal Modes
  const [role, setRole] = useState('teacher'); // 'teacher' | 'student'
  const [tab, setTab] = useState('login');     // 'login' | 'signup'
  const [signupStep, setSignupStep] = useState(1); // 1: initiate | 2: verify
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    post: '',
    year: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [signupOtp, setSignupOtp] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please provide both institutional email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginEmail.trim().toLowerCase(), loginPassword);
      toast.success(res.message || 'Login successful!');
      const from = location.state?.from
        ? `${location.state.from.pathname || ''}${location.state.from.search || ''}`
        : res.user?.role === 'teacher'
        ? '/faculty'
        : '/student';
      navigate(from || (res.user?.role === 'teacher' ? '/faculty' : '/student'), { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup Step 1: Initiate
  const handleSignupInitiate = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const payload = {
        role,
        fullName: signupData.fullName.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
        phone: signupData.phone.trim(),
        department: signupData.department.trim(),
        ...(role === 'teacher'
          ? { post: signupData.post.trim() }
          : { year: signupData.year.trim(), section: signupData.section.trim() }),
      };

      const res = await authApi.initiateSignup(payload);
      toast.success(res.message || 'Verification code sent to your email.');
      setSignupStep(2);
    } catch (err) {
      setSignupError(err.message || 'Signup initiation failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Signup Step 2: Verify OTP
  const handleSignupVerify = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (!signupOtp || signupOtp.trim().length !== 6) {
      setSignupError('Please enter the 6-digit OTP code.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await authApi.verifySignup({
        email: signupData.email.trim().toLowerCase(),
        otp: signupOtp.trim(),
      });

      toast.success(res.message || 'Account created successfully!');
      if (res.token && res.user) {
        setAuthData(res.token, res.user);
        const target = res.user.role === 'teacher' ? '/faculty' : '/student';
        navigate(target, { replace: true });
      }
    } catch (err) {
      setSignupError(err.message || 'Invalid or expired OTP.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setSignupError('');
    setResendLoading(true);
    try {
      const payload = {
        role,
        fullName: signupData.fullName.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
        phone: signupData.phone.trim(),
        department: signupData.department.trim(),
        ...(role === 'teacher'
          ? { post: signupData.post.trim() }
          : { year: signupData.year.trim(), section: signupData.section.trim() }),
      };
      const res = await authApi.initiateSignup(payload);
      toast.info(res.message || 'New verification code sent.');
    } catch (err) {
      setSignupError(err.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '1.5rem auto' }}>
      {/* Institutional Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Academic Portal Access
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Official faculty and student management workspace
        </p>
      </div>

      <Card>
        <CardBody style={{ padding: '1.75rem' }}>
          {/* Role Selector: Teacher / Student */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <button
              id="role-teacher-btn"
              type="button"
              className={`btn ${role === 'teacher' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.55rem', fontSize: '0.875rem' }}
              onClick={() => {
                setRole('teacher');
                setSignupStep(1);
                setSignupError('');
              }}
            >
              <UserCheck size={16} />
              <span>Faculty Member</span>
            </button>

            <button
              id="role-student-btn"
              type="button"
              className={`btn ${role === 'student' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.55rem', fontSize: '0.875rem' }}
              onClick={() => {
                setRole('student');
                setSignupStep(1);
                setSignupError('');
              }}
            >
              <GraduationCap size={16} />
              <span>Student</span>
            </button>
          </div>

          {/* Form Mode Tabs: Log In / Create Account */}
          <div className="tab-list" style={{ marginBottom: '1.25rem' }}>
            <button
              id="tab-login-btn"
              type="button"
              className={`tab-item ${tab === 'login' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setTab('login');
                setLoginError('');
              }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              id="tab-signup-btn"
              type="button"
              className={`tab-item ${tab === 'signup' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setTab('signup');
                setSignupError('');
              }}
            >
              <BookOpen size={15} />
              <span>Create Account</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              {loginError && (
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--status-danger-bg)',
                    border: '1px solid var(--status-danger-border)',
                    color: 'var(--status-danger-text)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                  role="alert"
                >
                  {loginError}
                </div>
              )}

              <Input
                id="login-email"
                label="Institutional Email"
                type="email"
                icon={Mail}
                placeholder={role === 'teacher' ? 'faculty.name@college.edu' : 'student.roll@college.edu'}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                id="login-password"
                label="Password"
                type="password"
                icon={Lock}
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem', marginBottom: '1.25rem' }}>
                <button
                  id="forgot-password-link"
                  type="button"
                  className="btn-ghost"
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.2rem',
                    color: 'var(--accent-text)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                variant="primary"
                icon={LogIn}
                loading={loginLoading}
                style={{ width: '100%' }}
              >
                Sign In as {role === 'teacher' ? 'Faculty' : 'Student'}
              </Button>
            </form>
          )}

          {/* TAB 2: SIGNUP SCREENS */}
          {tab === 'signup' && (
            <>
              {signupStep === 1 ? (
                <SignupScreen1
                  role={role}
                  formData={signupData}
                  setFormData={setSignupData}
                  onSubmit={handleSignupInitiate}
                  loading={signupLoading}
                  errorMessage={signupError}
                />
              ) : (
                <SignupScreen2
                  email={signupData.email}
                  otp={signupOtp}
                  setOtp={setSignupOtp}
                  onVerify={handleSignupVerify}
                  onBack={() => setSignupStep(1)}
                  onResend={handleResendOtp}
                  loading={signupLoading}
                  resendLoading={resendLoading}
                  errorMessage={signupError}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};

export default AuthPage;
