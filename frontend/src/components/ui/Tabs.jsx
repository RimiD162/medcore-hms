import React from 'react';

export const Tabs = ({
  items = [],
  activeKey,
  onChange,
  className = '',
  variant = 'line', // 'line' | 'pills' | 'segmented'
}) => {
  return (
    <div className={`med-tabs-container med-tabs-${variant} ${className}`}>
      <div className="med-tabs-list" role="tablist">
        {items.map((tab) => {
          const isActive = activeKey === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`med-tab-btn ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && onChange && onChange(tab.key)}
              disabled={tab.disabled}
            >
              {Icon && <Icon size={16} className="med-tab-icon" />}
              <span className="med-tab-label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className={`med-tab-badge ${isActive ? 'active' : ''}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
