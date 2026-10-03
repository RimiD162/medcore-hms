import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'teal', // 'teal' | 'blue' | 'purple' | 'amber' | 'emerald' | 'rose'
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  actionText,
  onActionClick,
  className = '',
}) => {
  return (
    <div className={`med-stat-card med-stat-${variant} ${className}`}>
      <div className="med-stat-top">
        <div className="med-stat-info">
          <span className="med-stat-title">{title}</span>
          <div className="med-stat-val-row">
            <span className="med-stat-value">{value !== undefined && value !== null ? value : '--'}</span>
            {change && (
              <span className={`med-stat-change change-${changeType}`}>
                {changeType === 'positive' && <ArrowUpRight size={13} />}
                {changeType === 'negative' && <ArrowDownRight size={13} />}
                {change}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className="med-stat-icon-wrap">
            <Icon size={22} />
          </div>
        )}
      </div>

      <div className="med-stat-bottom">
        {subtitle && <span className="med-stat-subtitle">{subtitle}</span>}
        {actionText && (
          <button
            type="button"
            className="med-stat-action-btn"
            onClick={onActionClick}
          >
            {actionText} &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

export default StatCard;
