import React from 'react';

const Badge = ({
  children,
  variant = 'neutral', // 'pending' | 'approved' | 'rejected' | 'neutral' | 'accent' | 'unread'
  className = '',
  icon: Icon,
  count,
}) => {
  const isUnread = variant === 'unread';
  const badgeVariant = isUnread ? 'badge-accent' : `badge-${variant}`;

  return (
    <span className={`badge ${badgeVariant} ${className}`}>
      {isUnread && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            display: 'inline-block',
          }}
        />
      )}
      {Icon && <Icon size={12} />}
      {children}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: '0.25rem',
            padding: '1px 5px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0,0,0,0.1)',
            fontSize: '0.7rem',
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
};

export default Badge;
