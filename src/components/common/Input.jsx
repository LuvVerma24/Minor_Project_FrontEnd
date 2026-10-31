import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  required = false,
  icon: Icon,
  type = 'text',
  id,
  name,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          style={Icon ? { paddingLeft: '2.4rem' } : {}}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>

      {error && (
        <div id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </div>
      )}
      {!error && hint && (
        <div id={`${inputId}-hint`} className="form-hint">
          {hint}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
