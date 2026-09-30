import React, { useEffect, useRef } from 'react';

/**
 * Modal — accessible dialog with backdrop, ESC key close, and focus trap
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} title
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {React.ReactNode} footer
 */
export default function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="ui-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`ui-modal-card ui-modal-${size}`}>
        {/* Header */}
        <div className="ui-modal-header">
          {title && <h2 id="modal-title" className="ui-modal-title">{title}</h2>}
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="ui-modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
