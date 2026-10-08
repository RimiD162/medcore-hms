import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  HeartPulse,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('patient.a@medcore.health');
  const [password, setPassword] = useState('Patient@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await patientApi.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data?.token) {
        localStorage.setItem('medcore_patient_token', res.data.token);
        localStorage.setItem('medcore_auth_token', res.data.token);
        navigate('/app/patient/dashboard');
      } else {
        // Fallback for demo
        localStorage.setItem('medcore_patient_token', 'demo-patient-token');
        localStorage.setItem('medcore_auth_token', 'demo-patient-token');
        navigate('/app/patient/dashboard');
      }
    } catch (err) {
      console.error('Login error', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type = 'A') => {
    if (type === 'A') {
      setEmail('patient.a@medcore.health');
      setPassword('Patient@123');
      localStorage.setItem('medcore_patient_token', 'demo-patient-token');
      localStorage.setItem('medcore_auth_token', 'demo-patient-token');
    } else {
      setEmail('patient.b@medcore.health');
      setPassword('Patient@123');
      localStorage.setItem('medcore_patient_token', 'demo-patient-b-token');
      localStorage.setItem('medcore_auth_token', 'demo-patient-b-token');
    }
    navigate('/app/patient/dashboard');
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
        maxWidth: 440,
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
            <HeartPulse size={30} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            MedCore Patient Portal
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
            Secure personal access to your medical records & care team
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

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Portal Account Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@medcore.health"
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.5rem',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                Password
              </label>
              <Link
                to="/portal/forgot-password"
                style={{ fontSize: '0.76rem', color: '#38bdf8', textDecoration: 'none' }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.5rem',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(6, 20, 32, 0.8)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
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
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Patient Portal'}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          borderRadius: 12,
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Instant 1-Click Demo Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('A')}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Patient A &rarr;
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('B')}
              style={{
                padding: '0.5rem',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Patient B &rarr;
            </button>
          </div>
        </div>

        {/* Redeem Invite Link */}
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
          Have an invitation code from the hospital?{' '}
          <Link to="/portal/register" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
            Activate Account &rarr;
          </Link>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none' }}>
            &larr; Back to Hospital Main Landing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginPage;
