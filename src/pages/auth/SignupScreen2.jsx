import React from 'react';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const SignupScreen2 = ({
  email,
  otp,
  setOtp,
  onVerify,
  onBack,
  onResend,
  loading,
  resendLoading,
  errorMessage,
}) => {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            border: '1px solid var(--accent-border)',
          }}
        >
          <KeyRound size={22} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
          Verify Your Email
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          A 6-digit verification OTP was sent to <strong>{email}</strong>
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 0.85rem',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={onVerify}>
        <Input
          id="signup-otp-input"
          label="6-Digit Verification Code"
          type="text"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
          style={{
            letterSpacing: '0.35em',
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
            height: '52px',
          }}
          hint="Check your inbox or developer console for the OTP"
        />

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button
            id="signup-verify-submit"
            type="submit"
            variant="primary"
            icon={CheckCircle2}
            loading={loading}
            style={{ width: '100%' }}
          >
            Verify & Create Account
          </Button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={onBack}
              disabled={loading}
            >
              Edit Details
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResend}
              loading={resendLoading}
              disabled={loading}
            >
              Resend Code
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignupScreen2;
