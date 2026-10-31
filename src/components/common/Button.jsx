import React from 'react';
import Spinner from './Spinner';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  id,
  title,
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'md' ? '' : size === 'icon' ? 'btn-icon-only' : `btn-${size}`;
  const isDisabled = disabled || loading;

  return (
    <button
      id={id}
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${loading ? 'btn-loading' : ''} ${className}`.trim()}
      disabled={isDisabled}
      onClick={onClick}
      title={title}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} />}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} />}
    </button>
  );
};

export default Button;
