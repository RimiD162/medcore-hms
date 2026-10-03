import React from 'react';

export const FormField = ({
  label,
  error,
  required = false,
  helperText,
  id,
  children,
  className = '',
}) => {
  return (
    <div className={`med-form-field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="med-form-label">
          <span>{label}</span>
          {required && <span className="med-required-mark">*</span>}
        </label>
      )}
      {children}
      {error && <span className="med-form-error" role="alert">{error}</span>}
      {!error && helperText && <span className="med-form-helper">{helperText}</span>}
    </div>
  );
};

export const Input = React.forwardRef(({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  icon: Icon,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`med-input-wrap ${Icon ? 'has-icon' : ''} ${error ? 'is-invalid' : ''}`}>
      {Icon && <Icon size={16} className="med-input-icon" />}
      <input
        ref={ref}
        type={type}
        id={id}
        name={name}
        value={value !== undefined && value !== null ? value : ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`med-input ${className}`}
        aria-invalid={!!error}
        {...props}
      />
    </div>
  );
});

export const Select = React.forwardRef(({
  id,
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Select option...',
  error,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className={`med-select-wrap ${error ? 'is-invalid' : ''}`}>
      <select
        ref={ref}
        id={id}
        name={name}
        value={value !== undefined && value !== null ? value : ''}
        onChange={onChange}
        disabled={disabled}
        className={`med-select ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
    </div>
  );
});

export const Textarea = React.forwardRef(({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`med-textarea-wrap ${error ? 'is-invalid' : ''}`}>
      <textarea
        ref={ref}
        id={id}
        name={name}
        value={value !== undefined && value !== null ? value : ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`med-textarea ${className}`}
        aria-invalid={!!error}
        {...props}
      />
    </div>
  );
});

export const InputField = ({ label, error, required, helperText, id, ...inputProps }) => (
  <FormField label={label} error={error} required={required} helperText={helperText} id={id}>
    <Input id={id} error={error} {...inputProps} />
  </FormField>
);

export const SelectField = ({ label, error, required, helperText, id, ...selectProps }) => (
  <FormField label={label} error={error} required={required} helperText={helperText} id={id}>
    <Select id={id} error={error} {...selectProps} />
  </FormField>
);

export const TextareaField = ({ label, error, required, helperText, id, ...textareaProps }) => (
  <FormField label={label} error={error} required={required} helperText={helperText} id={id}>
    <Textarea id={id} error={error} {...textareaProps} />
  </FormField>
);

export default { FormField, Input, Select, Textarea, InputField, SelectField, TextareaField };
