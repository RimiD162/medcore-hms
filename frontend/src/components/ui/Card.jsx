import React from 'react';

/**
 * Card — surface container
 * Slots: CardHeader, CardBody, CardFooter
 */
export function Card({ children, className = '', onClick }) {
  return (
    <div className={`ui-card ${onClick ? 'ui-card-clickable' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`ui-card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`ui-card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`ui-card-footer ${className}`}>{children}</div>;
}
