import React from 'react';
import PortalHeader from './PortalHeader';
import PortalHero from './PortalHero';
import GatewayCards from './GatewayCards';
import PortalBottomFeatures from './PortalBottomFeatures';

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
      </main>
    </div>
  );
};

export default PortalHome;
