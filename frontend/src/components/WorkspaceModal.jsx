import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  HeartPulse,
  Users,
  Pill,
  Microscope,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { rolesData } from '../data/rolesData';

const iconMap = {
  Stethoscope: Stethoscope,
  HeartPulse: HeartPulse,
  Users: Users,
  Pill: Pill,
  Microscope: Microscope,
  FileSpreadsheet: FileSpreadsheet,
};

export const WorkspaceModal = ({ selectedRole, onClose, onShowToast }) => {
  const [currentRole, setCurrentRole] = useState(selectedRole || rolesData[0]);

  const IconComponent = iconMap[currentRole.iconName] || Stethoscope;
  const ws = currentRole.workspaceData;

  const handleActionClick = (actionName) => {
    onShowToast(`${currentRole.title} Action: "${actionName}" executed successfully in real-time.`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="workspace-modal"
        style={{
          '--modal-border': currentRole.borderColor,
          '--modal-glow': currentRole.glowColor,
          '--modal-accent': currentRole.accentColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div
              className="modal-role-badge"
              style={{
                backgroundColor: currentRole.badgeBg,
                borderColor: currentRole.accentColor,
              }}
            >
              <IconComponent size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="modal-header-title">{ws.roleTitle}</h2>
                <span className="modal-live-pill">
                  <span className="modal-live-dot" /> Live System
                </span>
              </div>
              <p className="modal-header-subtitle">
                Role-specific portal for <strong>{currentRole.title}</strong> &bull; MedCore HMS Secure Node #07
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentRole.id === 'doctor' && (
              <button
                type="button"
                className="modal-action-pill"
                style={{
                  background: 'linear-gradient(135deg, #00a88f, #00d2b4)',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => {
                  onClose();
                  window.location.href = '/app/doctor';
                }}
              >
                <Stethoscope size={16} />
                <span>Launch Live Doctor EMR</span>
                <ArrowRight size={14} />
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Role Switcher Tabs */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>
              SWITCH SIMULATED WORKSPACE:
            </div>
            <div className="modal-role-tabs">
              {rolesData.map((role) => {
                const TabIcon = iconMap[role.iconName] || Stethoscope;
                const isActive = currentRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    className={`modal-tab-btn ${isActive ? 'active' : ''}`}
                    style={{ '--tab-color': role.accentColor }}
                    onClick={() => setCurrentRole(role)}
                  >
                    <TabIcon size={16} color={isActive ? role.accentColor : '#94a3b8'} />
                    <span>{role.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="modal-stats-grid">
            {ws.stats.map((stat, idx) => (
              <div key={idx} className="modal-stat-box">
                <span className="modal-stat-label">{stat.label}</span>
                <span className="modal-stat-value">{stat.value}</span>
                {stat.change && <span className="modal-stat-badge">{stat.change}</span>}
                {stat.status === 'urgent' && (
                  <span style={{ color: '#f87171', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Immediate Attention
                  </span>
                )}
                {stat.status === 'done' && (
                  <span style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Verified Synced
                  </span>
                )}
                {stat.status === 'attention' && (
                  <span style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Action Required
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Patient Queue / Roster Table */}
          <div className="modal-table-container">
            <div className="modal-section-title">
              <span>Current Active Records ({currentRole.title} View)</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 'normal' }}>
                Auto-refreshed 2s ago
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Patient / Subject</th>
                    <th>Age / Gender</th>
                    <th>Clinical Details / Item</th>
                    <th>Location / Token</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ws.recentPatients.map((patient, pIdx) => (
                    <tr key={pIdx}>
                      <td className="patient-name-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: currentRole.accentColor,
                          }}>
                            {patient.name.charAt(0)}
                          </div>
                          <span>{patient.name}</span>
                        </div>
                      </td>
                      <td>{patient.age}y &bull; {patient.gender}</td>
                      <td>{patient.diagnosis}</td>
                      <td>
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontFamily: 'monospace'
                        }}>
                          {patient.room}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          patient.status.toLowerCase().includes('crit') || patient.status.toLowerCase().includes('due') || patient.status.toLowerCase().includes('prio')
                            ? 'urgent'
                            : patient.status.toLowerCase().includes('stable') || patient.status.toLowerCase().includes('done') || patient.status.toLowerCase().includes('verif') || patient.status.toLowerCase().includes('paid')
                            ? 'stable'
                            : 'pending'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role-Specific Quick Actions Bar */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px', fontWeight: '600' }}>
              INSTANT CLINICAL WORKFLOW ACTIONS:
            </div>
            <div className="modal-actions-wrap">
              {ws.quickActions.map((action, aIdx) => (
                <button
                  key={aIdx}
                  className="modal-action-pill"
                  onClick={() => handleActionClick(action)}
                >
                  <Sparkles size={13} style={{ marginRight: '6px', display: 'inline' }} />
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceModal;
