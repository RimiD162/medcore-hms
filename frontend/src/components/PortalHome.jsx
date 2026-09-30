import React from 'react';
import PortalHeader from './PortalHeader';
import PortalHero from './PortalHero';
import GatewayCards from './GatewayCards';
import PortalBottomFeatures from './PortalBottomFeatures';
import Logo from './Logo';

export const PortalHome = ({
  theme,
  onToggleTheme,
  onOpenAuth,
  onSelectStaff,
  onSelectPatient,
}) => {
  return (
    <div className="portal-page-wrapper" data-theme={theme}>
      {/* Header */}
      <PortalHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenAuth={onOpenAuth}
      />

      {/* Main Container */}
      <main className="portal-container">
        {/* Top Hero Banner */}
        <PortalHero />

        {/* The Two Central Cards: Hospital Staff & Patient Portal */}
        <GatewayCards
          onSelectStaff={onSelectStaff}
          onSelectPatient={onSelectPatient}
        />

        {/* Bottom Feature Highlights Section */}
        <PortalBottomFeatures />

        {/* Clean Footer */}
        <footer className="site-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Logo size={22} />
            <span style={{ fontSize: '0.82rem', color: 'var(--portal-text-muted, #64748b)' }}>
              &copy; {new Date().getFullYear()} MedCore HMS. Unified Healthcare Management Platform.
            </span>
          </div>

          <div className="footer-links">
            <span style={{ fontSize: '0.82rem', color: 'var(--portal-text-muted, #64748b)' }}>
              HIPAA &bull; NABH &bull; GDPR Compliant Cloud Infrastructure
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default PortalHome;
