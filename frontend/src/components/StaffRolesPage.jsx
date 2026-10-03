import React, { useState } from 'react';
import Logo from './Logo';
import RoleGrid from './RoleGrid';
import WorkspaceModal from './WorkspaceModal';
import { rolesData } from '../data/rolesData';
import {
  ArrowLeft,
  Sparkles,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  CreditCard,
  Sun,
  Moon,
} from 'lucide-react';

export const StaffRolesPage = ({
  theme,
  onToggleTheme,
  onBackToHome,
  onOpenAuth,
  onShowToast,
}) => {
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState(null);

  const handleOpenWorkspace = (role) => {
    setActiveWorkspaceRole(role);
  };

  return (
    <div className="portal-page-wrapper">
      {/* 1. Fixed Top Navbar */}
      <header className="portal-navbar">
        <div className="portal-navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              className="portal-back-btn"
              onClick={onBackToHome}
              title="Return to Main Portal"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <Logo />
          </div>

          <div className="portal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onToggleTheme && (
              <button
                className="theme-toggle-btn"
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {theme === 'light' ? 'Dark' : 'Light'}
                </span>
              </button>
            )}

            <button
              className="portal-btn-signin"
              onClick={() => onOpenAuth('signin')}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Portal Container */}
      <main className="portal-container">
        {/* Attractive Hero Header Section */}
        <section className="staff-header-section">
          {/* Ambient Glow Backdrop Mesh */}
          <div className="staff-header-glow-bg" />

          {/* Top Floating Glass Badge */}
          <div className="staff-header-badge">
            <span className="staff-badge-pulse">
              <span className="staff-pulse-ring" />
              <span className="staff-pulse-dot" />
            </span>
            <Sparkles size={14} className="staff-badge-sparkle" />
            <span className="staff-badge-text">Hospital Staff Portal</span>
            <span className="staff-badge-divider">•</span>
            <span className="staff-badge-status">6 Workspaces Ready</span>
          </div>

          {/* Main Attractive Title */}
          <h1 className="staff-header-title">
            Select Your <span className="staff-title-gradient">Role</span>
          </h1>

          {/* Subtitle with High-readability Typography */}
          <p className="staff-header-subtitle">
            Choose your dedicated workspace below to manage clinical tasks, patient records, prescriptions, diagnostics and billing.
          </p>

          {/* Attractive Quick Feature Pills / Highlights */}
          <div className="staff-header-tags-row">
            <div className="staff-header-tag-pill tag-teal">
              <Stethoscope size={13} />
              <span>Clinical Tasks</span>
            </div>
            <div className="staff-header-tag-pill tag-blue">
              <FileText size={13} />
              <span>Patient Records</span>
            </div>
            <div className="staff-header-tag-pill tag-purple">
              <Pill size={13} />
              <span>Prescriptions</span>
            </div>
            <div className="staff-header-tag-pill tag-cyan">
              <Activity size={13} />
              <span>Diagnostics</span>
            </div>
            <div className="staff-header-tag-pill tag-amber">
              <CreditCard size={13} />
              <span>Billing</span>
            </div>
          </div>
        </section>

        {/* 3. 6 Role Cards Grid */}
        <RoleGrid
          roles={rolesData}
          onOpenWorkspace={handleOpenWorkspace}
        />
      </main>

      {/* Role Workspace Simulation Modal */}
      {activeWorkspaceRole && (
        <WorkspaceModal
          selectedRole={activeWorkspaceRole}
          onClose={() => setActiveWorkspaceRole(null)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

export default StaffRolesPage;
