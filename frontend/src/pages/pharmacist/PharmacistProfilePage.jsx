import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Shield,
  Clock,
  Phone,
  Mail,
  Save,
  Building,
  Award,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, InputField, SelectField, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistProfilePage = () => {
  const { onShowToast } = useOutletContext() || {};

  const { data: profile, loading, error, refetch } = usePharmacistData(pharmacistApi.getProfile);

  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    shift: 'Morning',
    department: 'Central Pharmacy & Dispensary',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || profile.pharmacistProfile?.phone || '',
        bio: profile.pharmacistProfile?.bio || '',
        shift: profile.pharmacistProfile?.shift || 'Morning',
        department: profile.pharmacistProfile?.department || 'Central Pharmacy & Dispensary',
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await pharmacistApi.updateProfile(formData);
      if (onShowToast) {
        onShowToast('Pharmacist profile updated successfully');
      }
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading pharmacist credentials and shift parameters..." />;
  }

  if (error || !profile) {
    return <ErrorState message={error || 'Profile not found'} onRetry={refetch} />;
  }

  const pProfile = profile.pharmacistProfile || {};

  return (
    <div className="med-page-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Pharmacist Staff Profile & Credentials
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Manage your contact information, shift schedules, and view immutable license credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
            alt={profile.fullName}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              objectFit: 'cover',
              border: '2px solid #059669',
            }}
          />

          <div style={{ flex: '1 1 260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {profile.fullName}
              </h2>
              <Badge variant="success">Active Pharmacist</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {profile.email} • Employee ID: <strong>{profile.employeeId || 'EMP-PHARM-001'}</strong>
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* Immutable Professional Credentials */}
        <Card title="1. Professional Credentials (Read-Only Safeguards)" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                System Role
              </label>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="var(--text-secondary)" />
                <span style={{ fontWeight: 600 }}>PHARMACIST (Licensed)</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                State Pharmacy License #
              </label>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={15} color="#059669" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pProfile.licenseNumber || 'RPH-2024-8849'}</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Assigned Workstation
              </label>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={15} color="var(--text-secondary)" />
                <span>Central Dispensary (Main OPD Lobby)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Editable Information */}
        <Card title="2. Shift & Contact Details" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <InputField
              label="Contact Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 99887 76644"
            />

            <SelectField
              label="Current Shift"
              name="shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              options={[
                { value: 'Morning', label: 'Morning Shift (07:00 - 15:00)' },
                { value: 'Evening', label: 'Evening Shift (15:00 - 23:00)' },
                { value: 'Night', label: 'Night Shift (23:00 - 07:00)' },
                { value: 'Rotational', label: 'Rotational On-Call' },
              ]}
            />

            <InputField
              label="Pharmacy Department"
              name="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <TextareaField
            label="Staff Bio & Clinical Notes"
            name="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="Specializations in sterile compounding, antimicrobial stewardship, clinical pharmacotherapy..."
          />
        </Card>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={saving}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Save Profile Updates
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PharmacistProfilePage;
