import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  AlertCircle,
  Save,
  CheckCircle2,
  Calendar,
  Lock,
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
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ height: 160, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)' }} />
        <div style={{ height: 300, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.03)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>
      {/* ── Profile Header Card ────────────────────────────────────── */}
      <div style={{
        padding: '1.75rem',
        borderRadius: 20,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #0284c7 0%, #00d2b4 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
        }}>
          {profile?.fullName ? profile.fullName.charAt(0) : 'P'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              {profile?.fullName}
            </h2>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
            }}>
              {profile?.patientIdNumber}
            </span>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: profile?.status === 'Active' ? '#dcfce7' : '#fef3c7',
              color: profile?.status === 'Active' ? '#15803d' : '#b45309',
            }}>
              {profile?.status || 'Active'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
            {profile?.dateOfBirth && (
              <div>DOB: {new Date(profile.dateOfBirth).toLocaleDateString()} ({profile.age} yrs)</div>
            )}
            <div>Gender: {profile?.gender}</div>
            {profile?.bloodGroup && (
              <div style={{ fontWeight: 600, color: '#ef4444' }}>Blood Group: {profile.bloodGroup}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Read-Only Clinical Records Card ────────────────────────── */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 18,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={18} color="#0284c7" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Clinical Information (Read-Only)</h3>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 0, marginBottom: '1.25rem' }}>
          Clinical parameters, allergies, and chronic condition records are managed strictly by licensed healthcare staff for patient safety.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recorded Allergies
            </div>
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {profile?.allergies && profile.allergies.length > 0 ? (
                profile.allergies.map((a, i) => (
                  <span key={i} style={{ padding: '0.2rem 0.6rem', borderRadius: 6, backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                    ⚠️ {a}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No known allergies recorded</span>
              )}
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chronic Conditions
            </div>
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {profile?.chronicConditions && profile.chronicConditions.length > 0 ? (
                profile.chronicConditions.map((c, i) => (
                  <span key={i} style={{ padding: '0.2rem 0.6rem', borderRadius: 6, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.8rem', fontWeight: 600 }}>
                    {c}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No chronic conditions recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Editable Contact & Emergency Form ─────────────────────── */}
      <form onSubmit={handleSubmit} style={{
        padding: '1.75rem',
        borderRadius: 18,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone size={18} color="#0284c7" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Editable Contact Information</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Primary Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Email (Read only authentication email) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Portal Login Email (Immutable)
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '0.9rem',
                cursor: 'not-allowed',
              }}
            />
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Emergency Contact Name / Relationship
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="e.g. John Doe (Spouse)"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Emergency Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
              Emergency Contact Phone
            </label>
            <input
              type="text"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
            Residential Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.4rem',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 700,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientProfilePage;
