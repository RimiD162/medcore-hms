import React, { useState } from 'react';

/**
 * Input — form text input with label, error, and helper text
 * @param {string} type       - 'text' | 'email' | 'password' | 'tel' | 'date' | 'number'
 * @param {string} label
 * @param {string} error      - validation error message
 * @param {string} helperText
 * @param {string} icon       - optional left icon element
 */
export default function Input({
  label,
  error,
  helperText,
  type = 'text',
  id,
  required,
  className = '',
  iconLeft,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
          {required && <span className="ui-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="ui-input-wrap">
        {iconLeft && <span className="ui-input-icon-left">{iconLeft}</span>}
        <input
          id={id}
          type={inputType}
          className={`ui-input ${error ? 'ui-input-error' : ''} ${iconLeft ? 'ui-input-has-icon' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="ui-input-toggle-password"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="ui-field-error" role="alert">{error}</p>}
      {!error && helperText && <p id={`${id}-helper`} className="ui-field-helper">{helperText}</p>}
    </div>
  );
}
