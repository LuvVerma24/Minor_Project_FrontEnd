import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Email -> 2: OTP -> 3: New Password -> 4: Success
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: Send OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Please provide your registered institutional email.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordStep1({ email: email.trim().toLowerCase() });
      toast.success(res.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send reset code. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordStep2({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      toast.success(res.message || 'Code verified. Set your new password.');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordStep3({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
        confirmNewPassword,
      });
      toast.success(res.message || 'Password reset successfully!');
      setStep(4);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 4 ? 'Password Reset Complete' : 'Reset Account Password'}
      subtitle={
        step === 1
          ? 'Step 1 of 3: Provide your registered email address'
          : step === 2
          ? 'Step 2 of 3: Enter the 6-digit OTP code'
          : step === 3
          ? 'Step 3 of 3: Create a new password'
          : 'Your credentials have been securely updated'
      }
      size="md"
    >
      {errorMessage && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit}>
          <Input
            id="forgot-email-input"
            label="Institutional Email Address"
            type="email"
            icon={Mail}
            placeholder="e.g. faculty.member@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              id="forgot-step1-submit"
              type="submit"
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              loading={loading}
            >
              Send Reset Code
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Enter OTP */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            A 6-digit code was sent to <strong>{email}</strong>. Please enter it below:
          </div>

          <Input
            id="forgot-otp-input"
            label="6-Digit Verification Code"
            type="text"
            icon={KeyRound}
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus
            style={{ letterSpacing: '0.25em', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}
          />

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Change Email
            </Button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                id="forgot-step2-submit"
                type="submit"
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
                loading={loading}
              >
                Verify Code
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: Enter New Password */}
      {step === 3 && (
        <form onSubmit={handleStep3Submit}>
          <Input
            id="forgot-new-password"
            label="New Password"
            type="password"
            icon={Lock}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />

          <Input
            id="forgot-confirm-password"
            label="Confirm New Password"
            type="password"
            icon={Lock}
            placeholder="Re-enter new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              id="forgot-step3-submit"
              type="submit"
              variant="primary"
              loading={loading}
            >
              Update Password
            </Button>
          </div>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <CheckCircle2 size={30} />
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
            Password Updated Successfully
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            You can now sign in to the portal using your new password.
          </p>

          <Button variant="primary" onClick={handleClose} style={{ minWidth: '140px' }}>
            Back to Sign In
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
