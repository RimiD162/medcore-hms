import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  padding = 'default', // 'none' | 'compact' | 'default' | 'spacious'
  onClick,
  ...props
}) => {
  return (
    <div
      className={`med-card med-card-pad-${padding} ${onClick ? 'med-card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className={`med-card-header ${headerClassName}`}>
          <div className="med-card-header-left">
            {Icon && (
              <div className="med-card-icon-box">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className="med-card-title">{title}</h3>}
              {subtitle && <p className="med-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="med-card-header-action">{action}</div>}
        </div>
      )}
      <div className={`med-card-body ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
