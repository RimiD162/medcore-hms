import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const roleLabels = {
  admin: 'Hospital Administrator',
  doctor: 'Doctor / Physician',
  nurse: 'Nurse / Ward Staff',
  receptionist: 'Front Desk',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  accountant: 'Accountant / Billing',
};

const kpiCards = [
  { label: 'Total Patients',   value: '—', note: 'Available in Phase 2', icon: '👥' },
  { label: 'Appointments Today', value: '—', note: 'Available in Phase 3', icon: '📅' },
  { label: "Today's Revenue",  value: '—', note: 'Available in Phase 9', icon: '💰' },
  { label: 'Bed Occupancy',    value: '—', note: 'Available in Phase 8', icon: '🛏' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-greeting">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="dashboard-role-line">
            {roleLabels[user?.role] || user?.role}
            {user?.hospital_name ? ` · ${user.hospital_name}` : ' · MedCore General Hospital'}
          </p>
        </div>
        <div className="dashboard-date-pill">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.label} className="dashboard-kpi-card">
            <div className="kpi-card-top">
              <span className="kpi-icon">{card.icon}</span>
              <span className="kpi-label">{card.label}</span>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-note">{card.note}</div>
          </div>
        ))}
      </div>

      {/* System Status Card */}
      <div className="dashboard-status-card">
        <h2 className="status-card-title">⚙️ System Status</h2>
        <div className="status-checklist">
          <div className="status-item status-ok">
            <span className="status-dot" />
            <strong>Phase 0 — Foundation</strong>
            <span className="status-badge">Complete</span>
          </div>
          <div className="status-item status-pending">
            <span className="status-dot status-dot-pending" />
            <strong>Phase 1 — Authentication + RBAC</strong>
            <span className="status-badge status-badge-pending">Up Next</span>
          </div>
          <div className="status-item status-pending">
            <span className="status-dot status-dot-pending" />
            <strong>Phase 2 — Hospital Core (Patients, Doctors)</strong>
            <span className="status-badge status-badge-pending">Pending</span>
          </div>
        </div>
        <p className="status-note">
          Clinical data modules unlock from Phase 2 onwards. The KPI cards above will populate with live hospital data as each phase is implemented.
        </p>
      </div>
    </div>
  );
}
