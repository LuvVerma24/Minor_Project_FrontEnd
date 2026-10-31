import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-surface-subtle)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
          }}
        >
          <Icon size={24} />
        </div>
      )}

      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.35rem',
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            maxWidth: '420px',
            marginBottom: action ? '1.25rem' : 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
