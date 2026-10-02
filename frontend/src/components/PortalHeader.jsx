import React from 'react';
import Logo from './Logo';

export const PortalHeader = ({ onOpenAuth }) => {
  return (
    <header className="portal-navbar">
      <div className="portal-navbar-inner">
        <div>
          <Logo />
        </div>

        {/* Action: Sign In */}
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
  );
};

export default PortalHeader;
