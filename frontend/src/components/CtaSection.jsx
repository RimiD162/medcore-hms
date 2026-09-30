import React from 'react';

export default function CtaSection({ onOpenDemo, onOpenContact }) {
  return (
    <section id="platform" className="medcore-cta-section">
      <div className="medcore-container">
        <div className="cta-rounded-card">
          {/* Main CTA Headline */}
          <h2 className="cta-headline font-serif">
            Bring your hospital onto one system.
          </h2>

          {/* Subtext description */}
          <p className="cta-subtext">
            Start with the core modules and grow into the full enterprise platform — 
            phased, audited, and on your schedule.
          </p>

          {/* CTA Buttons */}
          <div className="cta-buttons-wrap">
            <button 
              type="button" 
              className="btn-primary-pill cta-btn-main"
              onClick={onOpenDemo}
            >
              Book a demo
            </button>

            <button 
              type="button" 
              className="btn-outline-pill cta-btn-secondary"
              onClick={onOpenContact}
            >
              Talk to the team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
