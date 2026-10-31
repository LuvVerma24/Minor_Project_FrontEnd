import React from 'react';

const Skeleton = ({
  width = '100%',
  height = '1.25rem',
  borderRadius = 'var(--radius-md)',
  count = 1,
  className = '',
  style,
}) => {
  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border-subtle)',
        opacity: 0.7,
        animation: 'pulse 1.5s ease-in-out infinite',
        marginBottom: count > 1 ? '0.5rem' : 0,
        ...style,
      }}
      aria-hidden="true"
    />
  ));

  return count === 1 ? elements[0] : <>{elements}</>;
};

export default Skeleton;
