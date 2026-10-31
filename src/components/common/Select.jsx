import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  hint,
  required = false,
  options = [],
  id,
  name,
  className = '',
  disabled = false,
  placeholder = 'Select an option...',
  children,
  ...props
}, ref) => {
  const selectId = id || name || `select-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-hidden="true">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        name={name}
        disabled={disabled}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
        {children}
      </select>

      {error && (
        <div id={`${selectId}-error`} className="form-error" role="alert">
          {error}
        </div>
      )}
      {!error && hint && (
        <div id={`${selectId}-hint`} className="form-hint">
          {hint}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
