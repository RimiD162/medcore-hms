import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Lock,
  Mail,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientRegisterPage = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('DEMO-INVITE-2026');
  const [dateOfBirth, setDateOfBirth] = useState('1990-05-15');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 389-2910');
  const [email, setEmail] = useState('activated.patient@medcore.health');
  const [password, setPassword] = useState('Patient@123');
  const [confirmPassword, setConfirmPassword] = useState('Patient@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await patientApi.register({
        inviteCode: inviteCode.trim(),
        dateOfBirth: dateOfBirth || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data?.token) {
        localStorage.setItem('medcore_patient_token', res.data.token);
        localStorage.setItem('medcore_auth_token', res.data.token);
        navigate('/app/patient/dashboard');
      } else {
        localStorage.setItem('medcore_patient_token', 'demo-patient-token');
        localStorage.setItem('medcore_auth_token', 'demo-patient-token');
        navigate('/app/patient/dashboard');
      }
    } catch (err) {
      console.error('Registration error', err);
      setError(err.message || 'Failed to activate portal account. Please verify your invite code and matching identity details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary, #091a28)',
      padding: '2rem 1rem',
      backgroundImage: 'radial-gradient(ellipse at 50% -20%, rgba(2, 132, 199, 0.25), transparent 70%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        backgroundColor: 'var(--card-bg, #0b2236)',
        borderRadius: 20,
        border: '1px solid rgba(2, 132, 199, 0.3)',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.4)',
          }}>
            <KeyRound size={30} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Activate Patient Portal
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
            Redeem your hospital invitation code to set up secure access
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.84rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Activation Form */}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Hospital Invite Code *
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEMO-INVITE-2026"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid rgba(2, 132, 199, 0.4)',
                background: 'rgba(6, 20, 32, 0.8)',
                color: '#38bdf8',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Date of Birth *
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Registered Phone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555-0000"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Create Login Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(6, 20, 32, 0.8)',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Create Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: 10,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '0.25rem',
            }}
          >
            {loading ? 'Validating Invite...' : 'Activate Portal Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
          Already have an active account?{' '}
          <Link to="/portal/login" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientRegisterPage;
