import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Award,
  FlaskConical,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabProfilePage = () => {
  const { data: profile, loading, error, refetch } = useLabData(
    () => labApi.getProfile(),
    []
  );

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [formData, setFormData] = useState({
    licenseNumber: '',
    section: 'Clinical Pathology & Biochemistry',
    shift: 'DAY',
    qualifications: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        licenseNumber: profile.licenseNumber || '',
        section: profile.section || 'Clinical Pathology & Biochemistry',
        shift: profile.shift || 'DAY',
        qualifications: (profile.qualifications || []).join(', '),
        phone: profile.user?.phone || '',
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      await labApi.updateProfile({
        licenseNumber: formData.licenseNumber || undefined,
        section: formData.section,
        shift: formData.shift,
        qualifications: formData.qualifications
          ? formData.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
          : undefined,
      });

      setIsEditing(false);
      setFeedbackMsg({ type: 'success', text: 'Laboratory profile and credentials updated successfully.' });
      refetch();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading laboratory credentials..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const user = profile?.user || {};

  return (
    <div className="med-page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Staff Credentials & Laboratory Profile
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Medical laboratory scientist credentials, licensure tracking, section allocation, and peer verification eligibility.
          </p>
        </div>

        {!isEditing ? (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        )}
      </div>

      {feedbackMsg && (
        <div
          style={{
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200'}
            alt={user.fullName}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #8b5cf6' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user.fullName || 'Alex Mercer, MLS'}
              </h2>
              <Badge variant="primary">LAB_TECHNICIAN</Badge>
              {profile?.canVerify && (
                <Badge variant="success">Certified Peer Verifier</Badge>
              )}
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {profile?.section || 'Clinical Pathology & Biochemistry'} &bull; License: <strong>{profile?.licenseNumber || 'MLS-9821'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {user.email || 'lab@medcore.health'}
              </span>
              {user.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form or Readonly View */}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                MLS License Number
              </label>
              {!isEditing ? (
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {profile?.licenseNumber || 'MLS-9821'}
                </span>
              ) : (
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Assigned Section / Division
              </label>
              {!isEditing ? (
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {profile?.section || 'Clinical Pathology & Biochemistry'}
                </span>
              ) : (
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Shift Assignment
              </label>
              {!isEditing ? (
                <Badge variant="default">{profile?.shift || 'DAY'}</Badge>
              ) : (
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                >
                  <option value="DAY">DAY SHIFT (08:00 – 16:00)</option>
                  <option value="EVENING">EVENING SHIFT (16:00 – 00:00)</option>
                  <option value="NIGHT">NIGHT SHIFT (00:00 – 08:00)</option>
                  <option value="ROTATING">ROTATING</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Qualifications (Comma Separated)
              </label>
              {!isEditing ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(profile?.qualifications || ['B.Sc MLS', 'ASCP-Certified']).map((q, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: '#8b5cf6',
                        fontWeight: 600,
                      }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. B.Sc MLS, ASCP-Certified, QC Specialist"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
              )}
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={Save} disabled={submitting}>
                {submitting ? 'Saving Credentials...' : 'Save Profile Changes'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Verification Safety Policy Governance Card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>

          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dual Verification & Clinical Release Policy
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              In compliance with international diagnostic laboratory safety standards (CLIA / CAP / ISO 15189), MedCore HMS enforces a strict <strong>Separate Verifier Invariant</strong>: the medical technologist who inputs analyzer values into the worklist cannot self-verify and release the diagnostic report. All reports must receive an independent peer review before electronic release to attending physicians.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LabProfilePage;
