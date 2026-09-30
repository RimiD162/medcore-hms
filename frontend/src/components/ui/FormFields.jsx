import React from 'react';

export function Select({ label, error, helperText, id, required, children, className = '', ...props }) {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
          {required && <span className="ui-required"> *</span>}
        </label>
      )}
      <select
        id={id}
        className={`ui-select ${error ? 'ui-input-error' : ''}`}
        aria-invalid={!!error}
        required={required}
        {...props}
      >
        {children}
      </select>
      {error && <p className="ui-field-error" role="alert">{error}</p>}
      {!error && helperText && <p className="ui-field-helper">{helperText}</p>}
    </div>
  );
}

export function Textarea({ label, error, helperText, id, required, rows = 4, className = '', ...props }) {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label htmlFor={id} className="ui-label">
          {label}
          {required && <span className="ui-required"> *</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`ui-textarea ${error ? 'ui-input-error' : ''}`}
        aria-invalid={!!error}
        required={required}
        {...props}
      />
      {error && <p className="ui-field-error" role="alert">{error}</p>}
      {!error && helperText && <p className="ui-field-helper">{helperText}</p>}
    </div>
  );
}
