import React from 'react';

/**
 * Button — Reusable button component
 * @param {string} variant - 'primary' | 'outline' | 'ghost' | 'danger'
 * @param {string} size    - 'sm' | 'md' | 'lg'
 * @param {boolean} loading
 * @param {boolean} disabled
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const base = 'ui-btn';
  const variants = {
    primary: 'ui-btn-primary',
    outline: 'ui-btn-outline',
    ghost:   'ui-btn-ghost',
    danger:  'ui-btn-danger',
  };
  const sizes = {
    sm: 'ui-btn-sm',
    md: 'ui-btn-md',
    lg: 'ui-btn-lg',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${loading ? 'ui-btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
