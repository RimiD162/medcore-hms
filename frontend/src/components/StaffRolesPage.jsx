import React, { useState } from 'react';
import Logo from './Logo';
import RoleGrid from './RoleGrid';
import WorkspaceModal from './WorkspaceModal';
import { rolesData } from '../data/rolesData';
import { ArrowLeft } from 'lucide-react';

export const StaffRolesPage = ({ onBackToHome, onOpenAuth, onShowToast }) => {
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

          <div className="portal-header-actions">
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
        {/* Clean Page Title Header */}
        <section className="staff-header-section">
          <h1 className="staff-header-title">
            Select Your <span className="teal-highlight">Role</span>
          </h1>

          <p className="staff-header-subtitle">
            Choose your dedicated workspace below to manage clinical tasks, patient records, prescriptions, diagnostics and billing.
          </p>
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
