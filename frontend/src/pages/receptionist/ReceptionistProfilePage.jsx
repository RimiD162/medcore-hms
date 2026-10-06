import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Building2,
  Clock,
  Phone,
  Mail,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistProfilePage = () => {
  const { onShowToast } = useOutletContext() || {};

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [deskLocation, setDeskLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getProfile();
      const data = res.data || res;
      setProfile(data);
      setPhone(data.user?.phone || '');
      setEmergencyPhone(data.receptionistProfile?.emergencyPhone || '');
      setDeskLocation(data.receptionistProfile?.deskLocation || '');
    } catch (err) {
      setError(err.message || 'Failed to load staff profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await receptionistApi.updateProfile({
        phone: phone || undefined,
        emergencyPhone: emergencyPhone || undefined,
        deskLocation: deskLocation || undefined,
      });

      setSaveSuccess(true);
      if (onShowToast) {
        onShowToast('Receptionist profile details updated successfully.');
      }
      setTimeout(() => setSaveSuccess(false), 4000);
      fetchProfile();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading receptionist staff profile & credentials..." />;
  }

  if (error || !profile) {
    return <ErrorState message={error || 'Failed to load profile'} onRetry={fetchProfile} />;
  }

  const user = profile.user || {};
  const recProfile = profile.receptionistProfile || {};

  return (
    <div className="med-page-container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* 1. Header Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={28} color="#00d2b4" /> Receptionist Staff Profile
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
          Manage your contact credentials and view shift allocations.
        </p>
      </div>

      {/* 2. Profile Card Banner */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(15, 124, 122, 0.15), rgba(6, 19, 31, 0.8))',
          border: '1px solid rgba(0, 210, 180, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
            alt={user.fullName}
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00d2b4' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc' }}>
                {user.fullName}
              </h2>
              <Badge variant="teal">Staff ID: {recProfile.employeeId || 'REC-8801'}</Badge>
              <Badge variant="blue">Role: {user.role}</Badge>
            </div>

            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Hospital Email: <strong style={{ color: '#f8fafc' }}>{user.email}</strong> &bull; Workstation: <strong style={{ color: '#00d2b4' }}>{recProfile.deskLocation || 'Main Lobby'}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Shift & Role Overview (Read-Only) */}
      <Card title="Shift & Workstation Assignment" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>ASSIGNED SHIFT</span>
            <strong style={{ color: '#f8fafc' }}>{recProfile.shift || 'Morning Shift (07:00 - 15:30)'}</strong>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>DESK / COUNTER</span>
            <strong style={{ color: '#00d2b4' }}>{recProfile.deskLocation || 'Main Lobby Front Desk - Counter 1'}</strong>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>DEPARTMENT</span>
            <strong style={{ color: '#f8fafc' }}>Main Lobby / Front Desk Operations</strong>
          </div>

          <div>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>ROLE SECURITY</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontWeight: '600' }}>
              <Lock size={13} /> Immutable Staff Role
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Update Contact Details Form */}
      <Card title="Update Contact Information">
        {saveSuccess && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>Profile contact details updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label className="med-form-label">Phone Number</label>
              <input
                type="tel"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="+91 99887 76655"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="med-form-label">Emergency Phone</label>
              <input
                type="tel"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="+91 99887 76656"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="med-form-label">Desk / Station Label</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="Main Lobby Front Desk - Counter 1"
                value={deskLocation}
                onChange={(e) => setDeskLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={16} style={{ marginRight: '6px' }} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReceptionistProfilePage;
