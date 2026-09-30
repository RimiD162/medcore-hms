import React from 'react';

export default function MetricsBar({ onSelectMetric }) {
  const metrics = [
    {
      value: "23",
      label: "operational modules across the hospital",
      actionKey: "modules"
    },
    {
      value: "8",
      label: "staff roles, from admin to accountant",
      actionKey: "roles"
    },
    {
      value: "4",
      label: "phased rollout to full enterprise scope",
      actionKey: "phases"
    },
    {
      value: "24×7",
      label: "audit-ready activity logging",
      actionKey: "audit"
    }
  ];

  return (
    <section className="medcore-metrics-section">
      <div className="medcore-container">
        <div className="metrics-grid-container">
          {metrics.map((item, idx) => (
            <div 
              key={idx} 
              className="metric-card-item"
              onClick={() => onSelectMetric && onSelectMetric(item.actionKey)}
            >
              <div className="metric-number font-serif">
                {item.value}
              </div>
              <div className="metric-label">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
