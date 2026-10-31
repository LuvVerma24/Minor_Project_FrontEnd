import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <FileQuestion size={28} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        The requested academic resource or page does not exist or has been relocated.
      </p>

      <Link to="/">
        <Button variant="primary" icon={ArrowLeft}>
          Return to Portal
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
