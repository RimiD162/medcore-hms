import React, { useState, useEffect } from 'react';
import { ShieldCheck, Menu, X, ChevronRight, Activity } from 'lucide-react';

export default function Navbar({ onOpenDemo, onOpenModules, onOpenContact, onNavigateSection }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`medcore-navbar-wrapper ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="medcore-container nav-inner">
        {/* Brand Logo */}
        <a href="#hero" className="brand-link" onClick={() => handleNavClick('hero')}>
          <div className="brand-emblem">
            <span>M</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">MedCore</span>
            <span className="brand-badge">HMS</span>
          </div>
        </a>

        {/* Center Desktop Navigation */}
        <nav className="desktop-nav">
          <button 
            type="button" 
            className="nav-link-btn" 
            onClick={() => {
              if (onOpenModules) onOpenModules();
              else handleNavClick('modules');
            }}
          >
            Modules
          </button>
          <button 
            type="button" 
            className="nav-link-btn" 
            onClick={() => handleNavClick('platform')}
          >
            Platform
          </button>
          <button 
            type="button" 
            className="nav-link-btn" 
            onClick={() => handleNavClick('roles')}
          >
            Workspaces
          </button>
          <button 
            type="button" 
            className="nav-link-btn" 
            onClick={() => {
              if (onOpenContact) onOpenContact();
              else handleNavClick('contact');
            }}
          >
            Contact
          </button>
        </nav>

        {/* Right CTA */}
        <div className="nav-actions">
          <div className="system-pill-status">
            <span className="live-dot"></span>
            <span className="live-label">23 Modules Live</span>
          </div>
          
          <button 
            type="button" 
            className="btn-primary-pill"
            onClick={onOpenDemo}
          >
            Book a demo
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            type="button" 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer animate-fade-in">
          <div className="mobile-nav-links">
            <button 
              type="button" 
              className="mobile-nav-item" 
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenModules) onOpenModules();
              }}
            >
              <span>Explore All 23 Modules</span>
              <ChevronRight size={18} />
            </button>
            <button 
              type="button" 
              className="mobile-nav-item" 
              onClick={() => handleNavClick('platform')}
            >
              <span>Platform Architecture</span>
              <ChevronRight size={18} />
            </button>
            <button 
              type="button" 
              className="mobile-nav-item" 
              onClick={() => handleNavClick('roles')}
            >
              <span>Role Workspaces</span>
              <ChevronRight size={18} />
            </button>
            <button 
              type="button" 
              className="mobile-nav-item" 
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenContact) onOpenContact();
              }}
            >
              <span>Contact & Advisory</span>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="mobile-drawer-footer">
            <button 
              type="button" 
              className="btn-primary-pill w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
            >
              Book a demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
