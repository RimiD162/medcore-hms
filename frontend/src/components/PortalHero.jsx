import React from 'react';
import { ShieldCheck, Clock, HeartHandshake } from 'lucide-react';

export const PortalHero = () => {
  return (
    <section className="portal-hero-banner">
      {/* Left Text Content */}
      <div className="portal-hero-content">
        <span className="portal-hero-badge">Hospital Management System</span>
        
        <h1 className="portal-hero-title">
          Better Care. Smarter<br />
          <span className="teal-highlight">Hospital Management.</span>
        </h1>

        <p className="portal-hero-desc">
          MedCore HMS brings patients, doctors and hospital staff together in one secure and unified platform. Streamline operations, improve patient care and make healthcare simpler.
        </p>

        <div className="portal-trust-pills">
          <div className="portal-trust-item">
            <ShieldCheck size={20} className="portal-trust-icon" />
            <span>Secure & Reliable</span>
          </div>
          <div className="portal-trust-item">
            <Clock size={20} className="portal-trust-icon" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Right Image Container */}
      <div className="portal-hero-image-wrap">
        <img
          src="/images/hero_doctor_patient.jpg"
          alt="Doctor attending patient with care"
          className="portal-hero-img"
        />

        {/* Decorative Handwritten Quote Badge */}
        <div className="portal-hero-quote">
          <span className="portal-hero-quote-text">
            Quality Care for a Healthier Tomorrow
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: '#00a88f', fontWeight: 'bold' }}>&#9825; MedCore</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortalHero;
