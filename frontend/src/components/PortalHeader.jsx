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

        {/* Action: Theme Toggle & Sign In */}
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
  );
};

export default PortalHeader;
