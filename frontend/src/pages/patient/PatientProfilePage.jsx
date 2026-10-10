import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Save,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientProfilePage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await patientApi.getProfile();
        if (res.data) {
          setProfile(res.data);
          setFormData({
            phone: res.data.phone || '',
            address: res.data.address || '',
            emergencyContact: res.data.emergencyContact || '',
            emergencyPhone: res.data.emergencyPhone || '',
          });
        }
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await patientApi.updateProfile(formData);
      if (res.data) {
        setProfile(res.data);
        if (onShowToast) onShowToast('Contact details updated successfully!');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="pp-skeleton" style={{ height: 120, borderRadius: 20 }} />
        <div className="pp-skeleton" style={{ height: 180, borderRadius: 18 }} />
        <div className="pp-skeleton" style={{ height: 280, borderRadius: 18 }} />
      </div>
    );
  }

  const avatarInitial = profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>

      {/* ── Profile Header Card ─────────────────────────────── */}
      <div className="pp-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 20,
          background: 'linear-gradient(135deg, #0284c7 0%, #00d2b4 100%)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.85rem', fontWeight: 800,
          boxShadow: '0 6px 16px rgba(2,132,199,0.3)',
          flexShrink: 0,
        }}>
          {avatarInitial}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--pp-text-primary)', letterSpacing: '-0.02em' }}>
              {profile?.fullName}
            </h2>
            <span className="pp-badge pp-badge-blue">{profile?.patientIdNumber}</span>
            <span className={`pp-badge ${profile?.status === 'Active' ? 'pp-badge-green' : 'pp-badge-yellow'}`}>
              {profile?.status || 'Active'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--pp-text-muted)', flexWrap: 'wrap' }}>
            {profile?.dateOfBirth && (
              <span>DOB: {new Date(profile.dateOfBirth).toLocaleDateString()} ({profile.age} yrs)</span>
            )}
            <span>Gender: {profile?.gender}</span>
            {profile?.bloodGroup && (
              <span style={{ fontWeight: 700, color: '#ef4444' }}>Blood Group: {profile.bloodGroup}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Clinical Information (Read-Only) ─────────────────── */}
      <div className="pp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Shield size={18} color="#0284c7" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--pp-text-primary)' }}>
            Clinical Information (Read-Only)
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--pp-text-muted)', marginTop: 0, marginBottom: '1.25rem' }}>
          Clinical parameters, allergies, and chronic conditions are managed by licensed healthcare staff for patient safety.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--pp-card-item-bg)', border: '1px solid var(--pp-card-item-border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Recorded Allergies
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {profile?.allergies?.length > 0 ? (
                profile.allergies.map((a, i) => (
                  <span key={i} className="pp-badge pp-badge-red">⚠️ {a}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--pp-text-dim)' }}>No known allergies recorded</span>
              )}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--pp-card-item-bg)', border: '1px solid var(--pp-card-item-border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Chronic Conditions
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {profile?.chronicConditions?.length > 0 ? (
                profile.chronicConditions.map((c, i) => (
                  <span key={i} className="pp-badge pp-badge-blue">{c}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--pp-text-dim)' }}>No chronic conditions recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Editable Contact Information ─────────────────────── */}
      <form onSubmit={handleSubmit} className="pp-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone size={18} color="#0284c7" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--pp-text-primary)' }}>
            Editable Contact Information
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.25rem' }}>
          <div className="pp-form-group">
            <label className="pp-label">Primary Phone Number</label>
            <input
              type="text"
              name="phone"
              className="pp-input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Portal Login Email (Immutable)</label>
            <input
              type="email"
              className="pp-input"
              value={profile?.email || ''}
              disabled
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Emergency Contact Name / Relationship</label>
            <input
              type="text"
              name="emergencyContact"
              className="pp-input"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="e.g. John Doe (Spouse)"
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Emergency Contact Phone</label>
            <input
              type="text"
              name="emergencyPhone"
              className="pp-input"
              value={formData.emergencyPhone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="pp-form-group">
          <label className="pp-label">Residential Address</label>
          <textarea
            name="address"
            className="pp-textarea"
            value={formData.address}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="pp-btn-primary" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving…' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfilePage;
