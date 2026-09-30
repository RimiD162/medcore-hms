import React from 'react';

export const Logo = ({ size = 32 }) => {
  return (
    <div className="brand-logo">
      <div className="logo-icon-svg" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 38 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Central Medical Cross with Cyan Glowing Segments */}
          {/* Center core */}
          <rect x="13" y="13" width="12" height="12" rx="3" fill="#00e5c0" />
          
          {/* Top Pill */}
          <rect x="13" y="2" width="12" height="8" rx="4" fill="#00c9a7" />
          
          {/* Bottom Pill */}
          <rect x="13" y="28" width="12" height="8" rx="4" fill="#00b4d8" />
          
          {/* Left Pill */}
          <rect x="2" y="13" width="8" height="12" rx="4" fill="#06b6d4" />
          
          {/* Right Pill */}
          <rect x="28" y="13" width="8" height="12" rx="4" fill="#00e5c0" />
          
          {/* Soft inner cross highlight */}
          <circle cx="19" cy="19" r="2.5" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>
      <span className="brand-text">
        MedCore <span className="hms-tag">HMS</span>
      </span>
    </div>
  );
};

export default Logo;
