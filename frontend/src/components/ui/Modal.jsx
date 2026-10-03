import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Button from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="med-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`med-modal-content med-modal-${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="med-modal-header">
          <div>
            {title && <h3 className="med-modal-title">{title}</h3>}
            {subtitle && <p className="med-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="med-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="med-modal-body">{children}</div>

        {footer && <div className="med-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'teal'
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '6px 0' }}>
        {variant === 'danger' && <AlertTriangle size={24} color="#d93c46" />}
        {variant === 'warning' && <AlertTriangle size={24} color="#f59e0b" />}
        {variant === 'primary' && <Info size={24} color="#00a88f" />}
        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--portal-text-body, #475569)' }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default Modal;
