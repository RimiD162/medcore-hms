import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Plus,
  X,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Button, Badge, Modal } from '../../components/ui';

export const ReceptionistPatientRegisterPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    registrationSource: 'Standard',
  });

  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [chronicConditions, setChronicConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [formError, setFormError] = useState(null);

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim() && !chronicConditions.includes(conditionInput.trim())) {
      setChronicConditions([...chronicConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (item) => {
    setChronicConditions(chronicConditions.filter((c) => c !== item));
  };

  const handleSubmit = async (e, allowDuplicate = false) => {
    if (e) e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        allergies,
        chronicConditions,
        allowDuplicate,
      };

      const res = await receptionistApi.registerPatient(payload);
      const data = res.data || res;

      if (data.duplicateWarning) {
        setDuplicateMatches(data.duplicates || []);
        setDuplicateModalOpen(true);
        setSubmitting(false);
        return;
      }

      if (onShowToast) {
        onShowToast(`Patient ${data.patient?.fullName} successfully registered! ID: ${data.patient?.patientIdNumber}`);
      }

      setDuplicateModalOpen(false);
      navigate(`/app/receptionist/patients/${data.patient?.id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to register patient. Please verify all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/patients')}>
            <ArrowLeft size={16} /> Back to Directory
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
              New Patient Registration
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Mint a unique MedCore Patient ID (MC-YYYY-NNNNNN) and register demographic file.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '20px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{formError}</span>
        </div>
      )}

      {/* 2. Registration Form */}
      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Section 1: Demographics */}
        <Card title="1. Patient Identity & Demographics" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="med-form-label">Full Name *</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Alexander Hamilton"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="med-form-label">Date of Birth</label>
              <input
                type="date"
                className="med-form-input"
                style={{ width: '100%' }}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="med-form-label">Gender *</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="med-form-label">Blood Group</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="med-form-label">Registration Source</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                value={formData.registrationSource}
                onChange={(e) => setFormData({ ...formData, registrationSource: e.target.value })}
              >
                <option value="Standard">Standard Intake</option>
                <option value="Walk-In">Walk-In</option>
                <option value="Emergency">Emergency</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Contact Details */}
        <Card title="2. Contact & Residential Information" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="med-form-label">Primary Phone Number *</label>
              <input
                type="tel"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. +91 98450 11223"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Used for automated SMS reminders and duplicate detection.
              </span>
            </div>

            <div>
              <label className="med-form-label">Email Address</label>
              <input
                type="email"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="med-form-label">Residential Address</label>
              <textarea
                className="med-form-textarea"
                rows={2}
                style={{ width: '100%' }}
                placeholder="Street address, apartment, city, state, postal code"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Emergency Contact & Intake Notes */}
        <Card title="3. Emergency Contact & Intake Flags" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="med-form-label">Emergency Contact Name</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Elizabeth Hamilton (Spouse)"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>

            <div>
              <label className="med-form-label">Emergency Contact Phone</label>
              <input
                type="tel"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. +91 98450 99887"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
          </div>

          {/* Allergies Chips */}
          <div style={{ marginBottom: '16px' }}>
            <label className="med-form-label">Known Allergies</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="med-form-input"
                style={{ flex: 1 }}
                placeholder="e.g. Penicillin, Peanuts, Latex"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddAllergy}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allergies.map((allergy, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  {allergy}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveAllergy(allergy)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="med-form-label">Known Chronic Conditions</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="med-form-input"
                style={{ flex: 1 }}
                placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCondition();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
                <Plus size={14} /> Add
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {chronicConditions.map((cond, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(0, 210, 180, 0.15)',
                    color: '#00d2b4',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  {cond}
                  <X
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveCondition(cond)}
                  />
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/app/receptionist/patients')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            <UserPlus size={16} style={{ marginRight: '6px' }} />
            {submitting ? 'Registering Patient...' : 'Complete Registration & Generate ID'}
          </Button>
        </div>
      </form>

      {/* Duplicate Warning Modal */}
      {duplicateModalOpen && (
        <Modal
          isOpen={duplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          title="Potential Duplicate Patient Detected"
        >
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>
                  Existing records found with matching phone or identity
                </strong>
                <span style={{ fontSize: '0.8rem' }}>
                  Please review the matching patient profiles below to avoid creating duplicate records.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {duplicateMatches.map((match) => (
                <div
                  key={match.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                      {match.fullName} &bull; <span style={{ color: '#00d2b4' }}>{match.patientIdNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                      Phone: {match.phone} &bull; Registered: {new Date(match.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      setDuplicateModalOpen(false);
                      navigate(`/app/receptionist/patients/${match.id}`);
                    }}
                  >
                    Open Profile &rarr;
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" onClick={() => setDuplicateModalOpen(false)}>
                Review Form
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleSubmit(null, true)}
                disabled={submitting}
              >
                Proceed & Create New Record Anyway
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReceptionistPatientRegisterPage;
