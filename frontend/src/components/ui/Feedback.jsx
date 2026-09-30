import React from 'react';

/** Skeleton shimmer variants */
export function SkeletonLine({ width = '100%', height = '16px' }) {
  return <div className="ui-skeleton-line" style={{ width, height }} />;
}

export function SkeletonBlock({ height = '120px', className = '' }) {
  return <div className={`ui-skeleton-block ${className}`} style={{ height }} />;
}

export function SkeletonCard() {
  return (
    <div className="ui-card ui-skeleton-card">
      <SkeletonLine width="40%" height="14px" />
      <SkeletonLine width="60%" height="32px" />
      <SkeletonLine width="80%" height="12px" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="ui-table-wrap">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ui-skeleton-table-row">
          {Array.from({ length: cols }).map((__, j) => (
            <SkeletonLine key={j} width={j === 0 ? '30%' : '15%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** EmptyState — shown when a list has zero records */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="ui-empty-state">
      {icon && <div className="ui-empty-icon">{icon}</div>}
      <h3 className="ui-empty-title">{title}</h3>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && (
        <button type="button" className="ui-btn ui-btn-primary ui-btn-md" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/** PageHeader — consistent page top bar with title, breadcrumb, and action */
export function PageHeader({ title, subtitle, breadcrumbs, action }) {
  return (
    <div className="ui-page-header">
      {breadcrumbs && (
        <nav className="ui-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="ui-breadcrumb-item">
              {i < breadcrumbs.length - 1 ? (
                <>{crumb} <span className="ui-breadcrumb-sep">›</span> </>
              ) : (
                <strong>{crumb}</strong>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="ui-page-header-row">
        <div>
          <h1 className="ui-page-title">{title}</h1>
          {subtitle && <p className="ui-page-subtitle">{subtitle}</p>}
        </div>
        {action && (
          <div className="ui-page-header-action">{action}</div>
        )}
      </div>
    </div>
  );
}
