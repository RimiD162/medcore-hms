import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Clock,
  Award,
  Save,
  CheckCircle2,
  HeartPulse,
  Users,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, InputField, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const NurseProfilePage = () => {
  const { onShowToast } = useOutletContext() || {};
  const { data: profile, loading, error, refetch } = useNurseData(nurseApi.getProfile);

  const [form, setForm] = useState({
    phone: '',
    bio: '',
    shift: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.user?.phone || '',
        bio: profile.bio || '',
        shift: profile.shift || 'Morning Shift (07:00 - 15:00)',
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await nurseApi.updateProfile({
        phone: form.phone,
        bio: form.bio,
        shift: form.shift,
      });
      if (onShowToast) onShowToast('Nurse profile updated successfully.');
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading nurse profile credentials..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const user = profile?.user || {};
  const assignments = profile?.nurseAssignments || [];

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={24} color="#00d2b4" />
          Clinical Nurse Profile & Credentials
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
          Manage your contact information, shift roster preferences, and hospital credentials
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Credentials & Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1594824813624-9b28a883907c?auto=format&fit=crop&q=80&w=200'}
                alt={user.fullName}
                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00d2b4', boxShadow: '0 4px 14px rgba(0, 210, 180, 0.25)' }}
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                  {user.fullName || 'Nurse Sarah Jenkins'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Badge variant="teal">{user.role || 'NURSE'}</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                    ID: <strong>{user.employeeId || 'EMP-N-101'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                <Mail size={16} color="#00d2b4" />
                <span>{user.email || 'nurse.jenkins@medcore.health'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                <Phone size={16} color="#00d2b4" />
                <span>{user.phone || '+91 98200 11223'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                <Building size={16} color="#00d2b4" />
                <span>{user.hospital?.name || 'MedCore Apex Hospital, New Delhi'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                <ShieldCheck size={16} color="#00d2b4" />
                <span>Nursing License: <strong style={{ color: '#fff' }}>{profile?.licenseNumber || 'RN-88492'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                <Clock size={16} color="#00d2b4" />
                <span>Current Shift: <strong style={{ color: '#00d2b4' }}>{profile?.shift || 'Morning Shift'}</strong></span>
              </div>
            </div>

            {profile?.qualifications && profile.qualifications.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', marginBottom: '8px' }}>
                  CLINICAL QUALIFICATIONS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {profile.qualifications.map((q, idx) => (
                    <Badge key={idx} variant="blue">{q}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Active Assignments Overview */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Users size={18} color="#00d2b4" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Active Patient Care Assignments</h3>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Currently managing <strong>{assignments.length}</strong> active inpatients in {profile?.ward || 'Ward 3B'}.
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Profile Settings Form */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '700' }}>Update Profile & Roster Settings</h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField
              label="Contact Phone Number"
              placeholder="+91 98200 11223"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <InputField
              label="Shift Roster Preference"
              placeholder="e.g. Morning Shift (07:00 - 15:00)"
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
            />

            <TextareaField
              label="Professional Bio & Ward Focus"
              placeholder="Experience summary, specialized nursing certifications, cardiac telemetry experience..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button type="submit" variant="primary" disabled={saving}>
                <Save size={15} style={{ marginRight: '6px' }} />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NurseProfilePage;
