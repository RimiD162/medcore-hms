import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Award,
  Briefcase,
  Edit,
  Save,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const AccountantProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ phone: '', bio: '', qualifications: '' });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountantApi.getProfile();
      const p = res.data || res;
      setProfile(p);
      setFormData({
        phone: p.user?.phone || '',
        bio: p.bio || '',
        qualifications: p.qualifications?.join(', ') || 'Chartered Accountant (CA), B.Com (Hons)',
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const qualArray = formData.qualifications
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean);

      await accountantApi.updateProfile({
        phone: formData.phone,
        bio: formData.bio,
        qualifications: qualArray,
      });

      setSaveSuccess(true);
      setIsEditing(false);
      fetchProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading staff finance profile..." />;
  }

  if (error && !profile) {
    return <ErrorState message={error} onRetry={fetchProfile} />;
  }

  const u = profile?.user || {};
  const isSenior = profile?.isSeniorApprover;

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={28} color="#00d2b4" /> Accountant Staff Profile
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Financial credentials, approval authorization tier, and departmental assignments.
          </p>
        </div>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit size={14} style={{ marginRight: '6px' }} /> Edit Profile
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel Editing
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> Profile details saved successfully!
        </div>
      )}

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Profile Card */}
        <Card>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '20px' }}>
            <img
              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={u.fullName}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00d2b4' }}
            />
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                {u.fullName}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#00d2b4', marginTop: '2px', fontWeight: '600' }}>
                {profile.designation || 'Senior Financial Controller'}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                <Badge variant={isSenior ? 'teal' : 'neutral'}>
                  {isSenior ? 'Senior Finance Approver' : 'Finance Staff'}
                </Badge>
                <Badge variant="neutral">{profile.employeeIdNumber || 'EMP-FIN-001'}</Badge>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Email:</span>
              <span style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600' }}>{u.email}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Phone:</span>
              <span style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600' }}>{u.phone || '+91 98450 12345'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Section:</span>
              <span style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600' }}>{profile.section || 'Revenue Cycle & General Ledger'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={16} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Qualifications:</span>
              <span style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600' }}>
                {profile.qualifications?.join(', ') || 'Chartered Accountant (CA)'}
              </span>
            </div>
          </div>
        </Card>

        {/* Edit or Governance Box */}
        <Card>
          {!isEditing ? (
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#00d2b4" /> Financial Governance & Dual Control
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: '1.6' }}>
                As part of MedCore HMS's financial integrity safeguards, high-impact transactions such as <strong>Patient Surplus Refunds</strong> and <strong>Operational Expense Authorizations</strong> are subject to role-based separation of duties.
              </p>

              <div style={{ background: 'rgba(0, 210, 180, 0.06)', border: '1px solid rgba(0, 210, 180, 0.2)', borderRadius: '8px', padding: '14px', marginTop: '16px' }}>
                <div style={{ fontWeight: '700', color: '#00d2b4', fontSize: '0.88rem', marginBottom: '4px' }}>
                  {isSenior ? 'Senior Authorization Tier Active' : 'Staff Level Access'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #f8fafc)' }}>
                  {isSenior
                    ? 'You have elevated privileges to approve refund requests and author hospital expenses.'
                    : 'Your account can initiate invoices, collect receipts, and queue refund requests for senior review.'}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 14px' }}>
                Edit Contact & Bio Information
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Qualifications (comma separated)
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Professional Bio / Notes
                </label>
                <textarea
                  className="med-form-textarea"
                  style={{ width: '100%', height: '80px' }}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AccountantProfilePage;
