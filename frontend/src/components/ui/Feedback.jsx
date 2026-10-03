import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button';

export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`med-skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
};

export const Spinner = ({ size = 24, color = 'var(--primary-teal, #00a88f)', className = '' }) => {
  return (
    <div className={`med-spinner ${className}`} style={{ width: size, height: size, borderColor: `${color} transparent transparent transparent` }} />
  );
};

export const LoadingState = ({ message = 'Loading records...', className = '' }) => {
  return (
    <div className={`med-loading-state ${className}`}>
      <Spinner size={32} />
      <p className="med-loading-text">{message}</p>
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`med-empty-state ${className}`}>
      <div className="med-empty-icon-box">
        <Icon size={36} />
      </div>
      <h4 className="med-empty-title">{title}</h4>
      <p className="med-empty-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction} className="med-empty-btn">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Unable to load data',
  message = 'A connection or server error occurred while retrieving this information.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`med-error-state ${className}`}>
      <div className="med-error-icon-box">
        <AlertCircle size={36} color="#d93c46" />
      </div>
      <h4 className="med-error-title">{title}</h4>
      <p className="med-error-desc">{message}</p>
      {onRetry && (
        <Button variant="outline" icon={RefreshCw} onClick={onRetry} className="med-error-btn">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default { Skeleton, Spinner, LoadingState, EmptyState, ErrorState };
