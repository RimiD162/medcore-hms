import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const AboutSection = () => {
  const stats = [
    { value: '500+', label: 'Hospitals & Medical Centers' },
    { value: '2.4M', label: 'Active Patient Records' },
    { value: '99.99%', label: 'Cloud System Uptime' },
    { value: '< 15s', label: 'Emergency Triage Sync' },
  ];

  return (
    <section id="about" className="info-section">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span className="section-badge">Trusted Healthcare Infrastructure</span>
        <h2 className="section-heading">Engineered for Uncompromising Patient Care</h2>
        <p className="section-subheading" style={{ margin: '0 auto' }}>
          MedCore HMS was built in partnership with leading chief medical officers, nursing superintendents, and healthcare CIOs to solve the friction of modern clinical operations.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {stats.map((s, idx) => (
          <div key={idx} style={{
            background: 'rgba(9, 26, 41, 0.6)',
            border: '1px solid rgba(0, 210, 180, 0.2)',
            borderRadius: '16px',
            padding: '24px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(120deg, #00d2b4, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '6px'
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const ContactSection = ({ onShowToast }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    contactName: '',
    email: '',
    bedsCount: '100 - 300 Beds',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    onShowToast(`Demo Request Received for ${formData.hospitalName || 'Your Hospital'}! Our specialist will contact you within 2 hours.`);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="info-section">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span className="section-badge">Get in Touch</span>
        <h2 className="section-heading">Schedule an Enterprise Walkthrough</h2>
        <p className="section-subheading" style={{ margin: '0 auto' }}>
          Experience MedCore HMS configured specifically for your facility's bed capacity and medical specialties.
        </p>
      </div>

      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        background: 'rgba(9, 26, 41, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '32px',
        backdropFilter: 'blur(12px)',
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <CheckCircle2 size={48} color="#00d2b4" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '8px' }}>
              Walkthrough Request Confirmed!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              We've dispatched access credentials and an interactive sandbox link to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="auth-form-group" style={{ margin: 0 }}>
                <label>Hospital / Clinic Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Apex Memorial Hospital"
                  required
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                />
              </div>
              <div className="auth-form-group" style={{ margin: 0 }}>
                <label>Your Name & Designation</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Dr. Sarah Walker (Medical Director)"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="auth-form-group" style={{ margin: 0 }}>
                <label>Official Work Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="director@apexhealth.org"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="auth-form-group" style={{ margin: 0 }}>
                <label>Facility Bed Capacity</label>
                <select
                  className="auth-input"
                  value={formData.bedsCount}
                  onChange={(e) => setFormData({ ...formData, bedsCount: e.target.value })}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Under 50 Beds" style={{ background: '#091a29' }}>Under 50 Beds (Clinic / Daycare)</option>
                  <option value="50 - 150 Beds" style={{ background: '#091a29' }}>50 - 150 Beds (Secondary Care)</option>
                  <option value="150 - 500 Beds" style={{ background: '#091a29' }}>150 - 500 Beds (Tertiary Hospital)</option>
                  <option value="500+ Beds" style={{ background: '#091a29' }}>500+ Beds (Multi-Campus Enterprise)</option>
                </select>
              </div>
            </div>

            <div className="auth-form-group" style={{ margin: 0 }}>
              <label>Specific Modules of Interest</label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. EHR, LIS Integration, Pharmacy Barcoding, TPA Cashless Billing"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button type="submit" className="auth-submit-btn" style={{ marginTop: '8px' }}>
              Request Dedicated Sandbox & Demo
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
