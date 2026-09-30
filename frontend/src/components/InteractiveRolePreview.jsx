import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Activity, 
  AlertCircle, 
  User, 
  FileText, 
  ChevronRight, 
  Heart, 
  Pill, 
  Building2, 
  Stethoscope,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function InteractiveRolePreview({ activeRole }) {
  const [selectedQueueItem, setSelectedQueueItem] = useState(0);

  if (!activeRole) return null;

  return (
    <div className="role-preview-container animate-fade-in">
      {/* Header of Simulated Workspace */}
      <div className="role-preview-header">
        <div className="preview-header-left">
          <div className="preview-role-icon">
            {activeRole.id === 'admin' && <Building2 size={20} />}
            {activeRole.id === 'doctor' && <Stethoscope size={20} />}
            {activeRole.id === 'nurse' && <Heart size={20} />}
            {activeRole.id === 'pharmacy' && <Pill size={20} />}
            {activeRole.id === 'frontdesk' && <User size={20} />}
          </div>
          <div>
            <div className="preview-role-title-row">
              <h4 className="preview-role-title">{activeRole.roleTitle}</h4>
              <span className="live-badge">
                <span className="live-pulse"></span> Active Session
              </span>
            </div>
            <p className="preview-role-tagline">{activeRole.tagline}</p>
          </div>
        </div>

        <div className="preview-header-right">
          <span className="system-sync-pill">
            <Activity size={14} /> HL7/FHIR Synced
          </span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="role-stats-grid">
        {activeRole.stats.map((stat, i) => (
          <div key={i} className="role-stat-card">
            <span className="stat-label">{stat.label}</span>
            <div className="stat-val-row">
              <span className="stat-val">{stat.value}</span>
              <span className={`stat-change ${stat.positive ? 'positive' : 'urgent'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Workspace Interactive Split */}
      <div className="role-workspace-body">
        {/* Left Column: Live Queue / Action List */}
        <div className="role-queue-col">
          <div className="col-header">
            <h5>Live Task & Queue Monitor</h5>
            <span className="badge-count">{activeRole.mockQueue.length} Active</span>
          </div>

          <div className="queue-list">
            {activeRole.mockQueue.map((item, idx) => (
              <div 
                key={idx} 
                className={`queue-item-card ${selectedQueueItem === idx ? 'is-selected' : ''}`}
                onClick={() => setSelectedQueueItem(idx)}
              >
                <div className="queue-item-top">
                  <span className="queue-id">{item.id || `ITEM-${idx + 1}`}</span>
                  <span className={`queue-status-tag ${item.status?.toLowerCase().includes('urgent') || item.status?.toLowerCase().includes('action') ? 'status-urgent' : 'status-normal'}`}>
                    {item.status}
                  </span>
                </div>

                <div className="queue-item-title">
                  {item.title || item.patient || item.test || 'Patient Record'}
                </div>

                <div className="queue-item-meta">
                  {item.reason && <span>{item.reason}</span>}
                  {item.vitals && <span className="mono-vitals">{item.vitals}</span>}
                  {item.task && <span>{item.task}</span>}
                  {item.items && <span>{item.items}</span>}
                  {item.token && <span>Token: <strong>{item.token}</strong> ({item.type})</span>}
                </div>

                <div className="queue-item-footer">
                  <span className="queue-time"><Clock size={12} /> {item.time || '10:30 AM'}</span>
                  <span className="queue-action-link">Open Record &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow Features & Action Panel */}
        <div className="role-features-col">
          <div className="col-header">
            <h5>Workspace Capabilities</h5>
            <span className="badge-security">Role Tier 1 Encrypted</span>
          </div>

          <div className="features-list-card">
            {activeRole.previewFeatures.map((feat, fi) => (
              <div key={fi} className="feature-capability-row">
                <div className="feature-check-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h6 className="capability-title">{feat.title}</h6>
                  <p className="capability-desc">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Audit trail activity banner */}
          <div className="role-audit-banner">
            <div className="audit-icon-box">
              <Sparkles size={16} />
            </div>
            <div className="audit-text">
              <span className="audit-label">Latest Immutable Audit Event:</span>
              <p className="audit-entry">"{activeRole.sampleActivity}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
