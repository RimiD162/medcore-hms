import React from 'react';

const statusMap = {
  // Appointment statuses
  SCHEDULED: { label: 'Scheduled', variant: 'blue' },
  CONFIRMED: { label: 'Confirmed', variant: 'teal' },
  COMPLETED: { label: 'Completed', variant: 'green' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  NO_SHOW: { label: 'No-Show', variant: 'amber' },

  // Consultation statuses
  DRAFT: { label: 'In Progress (Draft)', variant: 'amber' },

  // Lab Report statuses
  ORDERED: { label: 'Ordered', variant: 'purple' },
  SAMPLE_COLLECTED: { label: 'Sample Collected', variant: 'cyan' },
  PROCESSING: { label: 'Processing in Lab', variant: 'amber' },

  // General & Document statuses
  Active: { label: 'Active', variant: 'teal' },
  Pending: { label: 'Pending', variant: 'amber' },
  Urgent: { label: 'Urgent Alert', variant: 'red' },
  Reviewed: { label: 'Doctor Reviewed', variant: 'green' },
  'Awaiting Review': { label: 'Awaiting Review', variant: 'amber' },
};

export const Badge = ({
  status,
  variant,
  children,
  icon: Icon,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
}) => {
  const config = status && statusMap[status] ? statusMap[status] : null;
  const badgeVariant = variant || config?.variant || 'gray';
  const labelText = children || config?.label || status || 'Unknown';

  return (
    <span className={`med-badge med-badge-${badgeVariant} med-badge-${size} ${className}`}>
      <span className="med-badge-dot" />
      {Icon && <Icon size={12} className="med-badge-icon" />}
      <span className="med-badge-text">{labelText}</span>
    </span>
  );
};

export default Badge;
