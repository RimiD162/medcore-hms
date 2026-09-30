import React from 'react';
import { Sparkles, CheckCircle2, Shield, Layers, ArrowRight } from 'lucide-react';

export default function HeroSection({ onOpenDemo, onOpenModules }) {
  return (
    <section id="hero" className="medcore-hero-section">
      <div className="medcore-container hero-grid">
        {/* Left Content Column */}
        <div className="hero-content">
          {/* Eyebrow badge */}
          <div className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            <span className="eyebrow-text">HOSPITAL MANAGEMENT SYSTEM</span>
          </div>

          {/* Main Headline with Serif Typography */}
          <h1 className="hero-title font-serif">
            Run the <em>entire hospital</em> from one system.
          </h1>

          {/* Body Description */}
          <p className="hero-description">
            MedCore HMS brings patient care, appointments, medical records, pharmacy, 
            laboratory, billing, and administration together on a single enterprise platform.
          </p>

          {/* Action CTA Buttons */}
          <div className="hero-actions">
            <button 
              type="button" 
              className="btn-primary-pill hero-btn-main"
              onClick={onOpenDemo}
            >
              Book a demo
            </button>

            <button 
              type="button" 
              className="btn-outline-pill hero-btn-sub"
              onClick={onOpenModules}
            >
              Explore the modules
            </button>
          </div>

          {/* Micro-features Footer Line */}
          <div className="hero-microcopy">
            <span>Role-based access</span>
            <span className="bullet-sep">·</span>
            <span>Audit-ready</span>
            <span className="bullet-sep">·</span>
            <span>Modular rollout</span>
          </div>
        </div>

        {/* Right Image Visual Column */}
        <div className="hero-visual">
          <div className="hero-image-card">
            <img 
              src="/assets/doctor-hero.jpg" 
              alt="Female physician reviewing patient charts on a tablet in a modern hospital" 
              className="hero-main-photo"
              loading="eager"
            />

            {/* Subtle Floating Live EHR Status Tag */}
            <div className="floating-ehr-pill">
              <div className="pulse-indicator"></div>
              <div className="floating-ehr-text">
                <span className="ehr-headline">Live EHR Sync</span>
                <span className="ehr-sub">Zero-latency patient flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
