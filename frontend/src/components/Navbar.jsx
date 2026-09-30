import React from 'react';
import Logo from './Logo';

export const Navbar = ({ onOpenAuth }) => {
  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        <div>
          <Logo />
        </div>

        {/* Header Action Buttons */}
        <div className="header-actions">
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
  );
};

export default Navbar;
