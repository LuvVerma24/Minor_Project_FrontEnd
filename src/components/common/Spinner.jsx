import React from 'react';

const Spinner = ({ size = 'md', color, className = '' }) => {
  const sizePx = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;

  return (
    <svg
      className={`animate-spin ${className}`}
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: color || 'currentColor', display: 'inline-block' }}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.415, 31.415"
        strokeDashoffset="10"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.415, 31.415"
        strokeDashoffset="24"
      />
    </svg>
  );
};

export default Spinner;
