import React from 'react';

export default function Footer({ onOpenModules, onOpenContact, onNavigateSection }) {
  const handleNav = (sectionId) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="medcore-footer">
      <div className="medcore-container footer-inner">
        {/* Copyright notice matching screenshot */}
        <div className="footer-copyright">
          © 2026 MedCore HMS · Hospital Management System
        </div>

        {/* Footer Navigation Links */}
        <nav className="footer-nav">
          <button 
            type="button" 
            className="footer-link-btn"
            onClick={() => {
              if (onOpenModules) onOpenModules();
              else handleNav('modules');
            }}
          >
            Modules
          </button>
          <button 
            type="button" 
            className="footer-link-btn"
            onClick={() => handleNav('platform')}
          >
            Platform
          </button>
          <button 
            type="button" 
            className="footer-link-btn"
            onClick={() => {
              if (onOpenContact) onOpenContact();
              else handleNav('contact');
            }}
          >
            Contact
          </button>
        </nav>
      </div>
    </footer>
  );
}
