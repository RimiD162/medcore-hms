import React, { useState } from 'react';
import Logo from './Logo';
import RoleGrid from './RoleGrid';
import FeatureRibbon from './FeatureRibbon';
import WorkspaceModal from './WorkspaceModal';
import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';

export const StaffRolesPage = ({ onBackToHome, onOpenAuth, onShowToast }) => {
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState(null);

  const handleOpenWorkspace = (role) => {
    setActiveWorkspaceRole(role);
  };

  return (
    <div className="staff-page-wrapper">
      {/* Background Architectural Layers */}
      <div className="hospital-bg-layer" />
      <div className="hospital-bg-overlay" />

      {/* Atmospheric Glow Orbs */}
      <div className="glow-orb glow-orb-top" />
      <div className="glow-orb glow-orb-left" />
      <div className="glow-orb glow-orb-right" />

      {/* Top Navbar */}
      <header className="staff-top-nav">
        <div className="staff-top-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              className="btn-back-gateway"
              onClick={onBackToHome}
              title="Return to Portal Gateway"
            >
              <ArrowLeft size={16} />
              <span>Portal Home</span>
            </button>
            <Logo />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-sign-in"
              onClick={() => onOpenAuth('signin')}
            >
              Sign In
            </button>
            <button
              className="btn-get-started"
              onClick={() => onOpenAuth('register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Staff Roles Content */}
      <main className="main-content">
        {/* Staff Hero Title */}
        <section className="staff-hero-section">
          <h1 className="staff-hero-title">
            One System for Every Step<br />
            of <span className="highlight-text">Hospital Care.</span>
          </h1>
          <p className="staff-hero-desc">
            Connect clinical teams, hospital operations, pharmacy, laboratory and billing in one secure platform.
          </p>
        </section>

        {/* 6 Role Cards Grid */}
        <RoleGrid onOpenWorkspace={handleOpenWorkspace} />

        {/* Bottom Feature Ribbon */}
        <FeatureRibbon />

        {/* Footer */}
        <footer className="site-footer" style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Logo size={22} />
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              &copy; {new Date().getFullYear()} MedCore HMS Inc. Hospital Staff Operations Terminal.
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#00d2b4', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} />
            <span>256-Bit Encrypted Healthcare Node</span>
          </div>
        </footer>
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
