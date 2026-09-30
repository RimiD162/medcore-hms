import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Building2, User, Mail, Phone, Clock, Sparkles } from 'lucide-react';

export default function BookDemoModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    hospitalName: '',
    bedCount: '100-300 beds',
    fullName: '',
    workEmail: '',
    phone: '',
    role: 'Hospital Administrator / Medical Director',
    date: '2026-10-05',
    timeSlot: '10:00 AM - 11:00 AM'
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="medcore-modal-backdrop" onClick={onClose}>
      <div className="medcore-modal-card demo-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <div className="modal-body-content">
            <div className="modal-header">
              <div className="modal-badge-pill">
                <Sparkles size={14} /> Guided Enterprise Walkthrough
              </div>
              <h3 className="modal-title font-serif">Book a Personalized MedCore Demo</h3>
              <p className="modal-subtitle">
                Experience how MedCore HMS unifies your hospital's clinical care, operations, and billing in a tailored 30-minute session.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="demo-form-grid">
              <div className="form-group">
                <label className="form-label">Hospital / Healthcare Facility Name</label>
                <div className="input-with-icon">
                  <Building2 size={16} className="input-icon" />
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    placeholder="e.g. St. Jude Memorial Hospital"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Bed Capacity</label>
                  <select 
                    className="form-select"
                    value={formData.bedCount}
                    onChange={(e) => setFormData({...formData, bedCount: e.target.value})}
                  >
                    <option value="Under 50 beds">Under 50 beds (Daycare / Clinic)</option>
                    <option value="50-100 beds">50 - 100 beds (Community Hospital)</option>
                    <option value="100-300 beds">100 - 300 beds (Tertiary Care)</option>
                    <option value="300-600 beds">300 - 600 beds (Multi-specialty)</option>
                    <option value="600+ beds">600+ beds (Enterprise Network)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Role</label>
                  <select 
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Hospital Administrator / Medical Director">Hospital Admin / COO</option>
                    <option value="Chief Medical Officer (CMO) / Doctor">Doctor / CMO</option>
                    <option value="Chief Information Officer (CIO) / IT Lead">CIO / IT Director</option>
                    <option value="Nursing Superintendent / Ward Lead">Nursing Lead</option>
                    <option value="Finance & Billing Director">Finance / Billing Lead</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      required 
                      className="form-input"
                      placeholder="Dr. Eleanor Vance"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input 
                      type="email" 
                      required 
                      className="form-input"
                      placeholder="e.vance@hospital.org"
                      value={formData.workEmail}
                      onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input 
                      type="date" 
                      required 
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Time Window</label>
                  <div className="input-with-icon">
                    <Clock size={16} className="input-icon" />
                    <select 
                      className="form-select"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                    >
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                      <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary-pill w-full demo-submit-btn"
                >
                  {isSubmitting ? 'Reserving your session...' : 'Confirm Demo Reservation'}
                </button>
                <span className="secure-subtext">🔒 Confidential · HIPAA & HL7 Compliant Architecture</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="modal-success-state animate-fade-in">
            <div className="success-icon-badge">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="success-title font-serif">Demo Session Reserved!</h3>
            <p className="success-desc">
              Thank you, <strong>{formData.fullName}</strong>. A confirmation and calendar invite have been sent to <strong>{formData.workEmail}</strong>.
            </p>

            <div className="confirmation-summary-box">
              <div className="summary-row">
                <span>Facility:</span>
                <strong>{formData.hospitalName || 'St. Jude Memorial Hospital'}</strong>
              </div>
              <div className="summary-row">
                <span>Scale:</span>
                <strong>{formData.bedCount}</strong>
              </div>
              <div className="summary-row">
                <span>Date & Time:</span>
                <strong>{formData.date} at {formData.timeSlot}</strong>
              </div>
              <div className="summary-row">
                <span>Deployment Scope:</span>
                <strong>23 Modular Suites Walkthrough</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-primary-pill"
              onClick={handleReset}
            >
              Return to MedCore Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
