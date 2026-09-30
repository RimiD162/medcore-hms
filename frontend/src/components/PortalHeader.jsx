import React from 'react';
import Logo from './Logo';
import { Sun, Moon } from 'lucide-react';

export const PortalHeader = ({ theme, onToggleTheme, onOpenAuth }) => {
  return (
    <header className="portal-navbar">
      <div className="portal-navbar-inner">
        <div>
          <Logo />
        </div>

        {/* Actions: Theme Toggle & Sign In */}
        <div className="portal-header-actions">
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle light/dark theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Sun size={15} color="#d97706" />
                <Moon size={15} color="#94a3b8" />
              </>
            ) : (
              <>
                <Sun size={15} color="#94a3b8" />
                <Moon size={15} color="#38bdf8" />
              </>
            )}
          </button>

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
