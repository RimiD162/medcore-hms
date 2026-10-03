import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Stethoscope,
  DollarSign,
  Clock,
  Save,
  CheckCircle2,
  Award,
  Calendar,
  ShieldCheck,
  Hospital
} from 'lucide-react';
import { doctorApi } from '../../api/doctorApi';
import { Card, Button, FormField, Input, Select, Textarea, Badge, LoadingState, ErrorState } from '../../components/ui';

export const DoctorProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    department: '',
    roomNumber: '',
    consultationFee: 0,
    experienceYears: 0,
    bio: '',
    phone: '',
    name: '',
    email: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorApi.getProfile();
      const data = res.data?.data || res.data;
      setProfile(data);
      setFormData({
        specialization: data.doctorProfile?.specialization || '',
        qualifications: data.doctorProfile?.qualifications || '',
        department: data.doctorProfile?.department || '',
        roomNumber: data.doctorProfile?.roomNumber || '',
        consultationFee: data.doctorProfile?.consultationFee || 0,
        experienceYears: data.doctorProfile?.experienceYears || 0,
        bio: data.doctorProfile?.bio || '',
        phone: data.phone || '',
        name: data.name || '',
        email: data.email || '',
      });
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        specialization: formData.specialization,
        qualifications: formData.qualifications,
        department: formData.department,
        roomNumber: formData.roomNumber,
        consultationFee: parseFloat(formData.consultationFee) || 0,
        experienceYears: parseInt(formData.experienceYears, 10) || 0,
        bio: formData.bio,
        phone: formData.phone,
      };

      const res = await doctorApi.updateProfile(payload);
      setToastMessage('Profile settings updated successfully.');
      setTimeout(() => setToastMessage(null), 3500);
      fetchProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading doctor profile & credentials..." />;
  if (error) return <ErrorState title="Profile Error" message={error} onRetry={fetchProfile} />;

  const hospitalName = profile?.hospital?.name || 'MedCore Central Hospital';

  return (
    <div className="med-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="med-floating-toast">
          <CheckCircle2 size={18} color="#00d2b4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Doctor Profile & Clinical Settings</h1>
          <p className="med-page-subtitle">
            Manage your credentials, departmental affiliation, consultation fees, and public profile bio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Badge variant="teal" dot>
            Verified Practitioner
          </Badge>
          <Badge variant="primary">
            {profile?.role || 'DOCTOR'}
          </Badge>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Main Profile Form */}
        <Card title="Clinical Profile & Contact Info">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Full Name (Read-Only)">
                <Input
                  name="name"
                  value={formData.name}
                  disabled
                  icon={User}
                />
              </FormField>

              <FormField label="Registered Email (Read-Only)">
                <Input
                  name="email"
                  value={formData.email}
                  disabled
                  icon={Mail}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Contact Phone Number">
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  icon={Phone}
                />
              </FormField>

              <FormField label="Specialization" required>
                <Input
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiology, Internal Medicine"
                  icon={Stethoscope}
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Qualifications / Degrees" required>
                <Input
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="e.g. MD, MBBS, FACC"
                  icon={GraduationCap}
                  required
                />
              </FormField>

              <FormField label="Department" required>
                <Input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Cardiology OPD, Neurology"
                  icon={Building2}
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <FormField label="Room / OPD Cabin">
                <Input
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. OPD-102"
                />
              </FormField>

              <FormField label="Consultation Fee ($)">
                <Input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleChange}
                  placeholder="150"
                  icon={DollarSign}
                  min="0"
                  step="5"
                />
              </FormField>

              <FormField label="Years of Experience">
                <Input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="12"
                  icon={Award}
                  min="0"
                />
              </FormField>
            </div>

            <FormField
              label="Professional Summary / Bio"
              helperText="Brief summary visible to triage staff and on consultation summaries."
            >
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Senior Cardiologist with 12+ years of experience in clinical cardiology, echocardiography, and preventive heart care..."
                rows={4}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--portal-border-subtle, #e2e8f0)' }}>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={saving}
                size="md"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Sidebar Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Card */}
          <Card className="med-profile-summary-card">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00a88f, #00d2b4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  boxShadow: '0 4px 12px rgba(0, 168, 143, 0.3)',
                }}
              >
                {formData.name
                  ? formData.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'DR'}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--portal-text-heading, #0f172a)' }}>
                {formData.name}
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--primary-teal, #00a88f)', fontWeight: 500, margin: '0 0 8px 0' }}>
                {formData.specialization || 'Clinical Specialist'}
              </p>
              <Badge variant="teal" size="sm">
                Active Staff
              </Badge>
            </div>

            <div style={{ borderTop: '1px solid var(--portal-border-subtle, #e2e8f0)', marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--portal-text-muted, #64748b)' }}>Qualifications</span>
                <span style={{ fontWeight: 500 }}>{formData.qualifications || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--portal-text-muted, #64748b)' }}>Department</span>
                <span style={{ fontWeight: 500 }}>{formData.department || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--portal-text-muted, #64748b)' }}>Consultation Fee</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-teal, #00a88f)' }}>${formData.consultationFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--portal-text-muted, #64748b)' }}>OPD Room</span>
                <span style={{ fontWeight: 500 }}>{formData.roomNumber || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Affiliation & Security */}
          <Card title="Hospital Affiliation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Hospital size={20} color="#00a88f" />
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{hospitalName}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted, #64748b)', margin: 0 }}>Main Campus</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <div>
                  <p style={{ fontWeight: 500, margin: 0 }}>HIPAA & GDPR Compliant</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted, #64748b)', margin: 0 }}>Role-Based Access Control</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
