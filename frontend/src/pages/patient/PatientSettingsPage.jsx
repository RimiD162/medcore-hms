import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Settings,
  Lock,
  User,
  ShieldCheck,
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Smartphone,
  Mail,
  Home,
  Save,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientSettingsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('security');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Profile Edit State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await patientApi.getProfile();
        if (res.data && res.data.profile) {
          const p = res.data.profile;
          setProfile(p);
          setPhone(p.phoneNumber || '');
          setEmail(p.email || '');
          setAddress(p.address || '');
          setEmergencyContact(p.emergencyContact || '');
        }
      } catch (err) {
        console.error('Failed to load profile settings', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      if (onShowToast) onShowToast('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      if (onShowToast) onShowToast('New password and confirm password do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      setPasswordStatus(null);
      await patientApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      setPasswordStatus({ success: true, message: 'Password updated successfully!' });
      if (onShowToast) onShowToast('Security credentials updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error', err);
      setPasswordStatus({ success: false, message: err.message || 'Failed to update password' });
      if (onShowToast) onShowToast(err.message || 'Password update failed');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      await patientApi.updateProfile({
        phoneNumber: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
      });
      if (onShowToast) onShowToast('Contact details updated successfully');
    } catch (err) {
      console.error('Profile update error', err);
      if (onShowToast) onShowToast(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <Settings size={20} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
            Account Settings & Security
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
          Manage your portal login password, contact information, and privacy preferences.
        </p>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        paddingBottom: '0.5rem',
      }}>
        {[
          { id: 'security', label: 'Login & Password Security', icon: Lock },
          { id: 'contact', label: 'Contact Information', icon: User },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.2rem',
                borderRadius: 10,
                border: 'none',
                background: isSelected ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                color: isSelected ? '#0284c7' : 'var(--text-secondary, #64748b)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Security & Password Change Tab ─────────────────────────── */}
      {activeTab === 'security' && (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 16,
          padding: '2rem',
          maxWidth: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <KeyRound size={22} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
              Update Portal Login Password
            </h2>
          </div>

          {passwordStatus && (
            <div style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 10,
              backgroundColor: passwordStatus.success ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: passwordStatus.success ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: passwordStatus.success ? '#059669' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}>
              {passwordStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Current Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                New Password (minimum 8 characters) *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Confirm New Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              backgroundColor: 'rgba(2, 132, 199, 0.05)',
              border: '1px solid rgba(2, 132, 199, 0.15)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary, #64748b)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <ShieldCheck size={16} color="#0284c7" />
              <span>Passwords are salted with Argon2/Bcrypt and encrypted at rest.</span>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: updatingPassword ? 'not-allowed' : 'pointer',
                opacity: updatingPassword ? 0.7 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {updatingPassword ? 'Saving Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* ── Contact Info Edit Tab ───────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 16,
          padding: '2rem',
          maxWidth: 600,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <User size={22} color="#0284c7" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
              Editable Contact Information
            </h2>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Residential Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential street, city, state, zip"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                Emergency Contact (Name & Phone)
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Jane Miller (Spouse) - +1 555-0192"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--input-bg, #f8fafc)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Note: Clinical medical data (Date of Birth, Gender, Blood Group, UHID) is locked and can only be amended by the hospital Medical Records Department (MRD).
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: updatingProfile ? 'not-allowed' : 'pointer',
                opacity: updatingProfile ? 0.7 : 1,
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Save size={16} />
              <span>{updatingProfile ? 'Saving Changes...' : 'Save Contact Details'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientSettingsPage;
