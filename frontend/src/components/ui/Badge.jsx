import React from 'react';

/**
 * Badge — status label component
 * @param {string} color - 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'ochre'
 */
export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`ui-badge ui-badge-${color} ${className}`}>
      {children}
    </span>
  );
}
