import React from 'react';
import Logo from './Logo';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Logo size={24} />
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} MedCore HMS Inc. All rights reserved. HIPAA, GDPR & ISO 27001 Certified.
        </span>
      </div>

      <div className="footer-links">
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Integrated Clinical & Operations Management Platform
        </span>
      </div>
    </footer>
  );
};

export default Footer;
