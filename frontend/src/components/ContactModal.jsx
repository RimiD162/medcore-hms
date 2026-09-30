import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Mail, Phone, User, Building, Send } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hospital: '',
    phone: '',
    inquiryType: 'Enterprise Implementation & Pricing',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
    }, 500);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="medcore-modal-backdrop" onClick={onClose}>
      <div className="medcore-modal-card contact-modal" onClick={(e) => e.stopPropagation()}>
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
                <MessageSquare size={14} /> Advisory & Enterprise Solutions
              </div>
              <h3 className="modal-title font-serif">Speak with a MedCore Hospital Specialist</h3>
              <p className="modal-subtitle">
                Discuss deployment timelines, EHR data migration, custom hardware integration, or enterprise multi-branch pricing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="demo-form-grid">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      required 
                      className="form-input"
                      placeholder="Dr. Jonathan Reed"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                      placeholder="j.reed@hospital-group.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Hospital / Network Name</label>
                  <div className="input-with-icon">
                    <Building size={16} className="input-icon" />
                    <input 
                      type="text" 
                      required 
                      className="form-input"
                      placeholder="Apex Health Group"
                      value={formData.hospital}
                      onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Inquiry Area</label>
                  <select 
                    className="form-select"
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({...formData, inquiryType: e.target.value})}
                  >
                    <option value="Enterprise Implementation & Pricing">Enterprise Implementation & Pricing</option>
                    <option value="Legacy EMR / PACS Data Migration">Legacy EMR / PACS Data Migration</option>
                    <option value="Multi-Location Hospital Network">Multi-Location Hospital Network</option>
                    <option value="Custom Module & HL7 Integration">Custom Module & HL7 Integration</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">How can our hospital engineering team help?</label>
                <textarea 
                  rows={3} 
                  className="form-textarea"
                  placeholder="Share details regarding your hospital size, current challenges, or desired rollout timeline..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <div className="modal-actions-footer">
                <button 
                  type="submit" 
                  disabled={isSending}
                  className="btn-primary-pill w-full demo-submit-btn"
                >
                  <Send size={16} />
                  {isSending ? 'Sending request...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="modal-success-state animate-fade-in">
            <div className="success-icon-badge">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="success-title font-serif">Inquiry Received</h3>
            <p className="success-desc">
              Thank you, <strong>{formData.name}</strong>. A senior MedCore enterprise solutions lead will contact you within 2 business hours.
            </p>
            <button 
              type="button" 
              className="btn-primary-pill"
              onClick={handleReset}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
