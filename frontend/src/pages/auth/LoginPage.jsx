import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
    return null;
  }

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      // Phase 0: simulate login with demo credentials until Phase 1 backend is live
      if (email === 'admin@medcore.hms' && password === 'Admin@MedCore2026') {
        const demoUser = {
          id: '00000000-0000-0000-0000-000000000002',
          full_name: 'System Administrator',
          email: 'admin@medcore.hms',
          role: 'admin',
          hospital_name: 'MedCore General Hospital',
        };
        login(demoUser, 'demo-access-token-phase0');
        addToast(`Welcome back, ${demoUser.full_name}!`, 'success');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setApiError('Invalid credentials. Use admin@medcore.hms / Admin@MedCore2026 for demo.');
      }
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-emblem">M</div>
          <div>
            <p className="auth-brand-name">MedCore <span className="auth-brand-hms">HMS</span></p>
            <p className="auth-brand-tagline">Enterprise Hospital Management</p>
          </div>
        </div>

        <h1 className="auth-title">Sign in to your workspace</h1>
        <p className="auth-subtitle">Enter your hospital credentials to access your dashboard</p>

        {/* API Error Banner */}
        {apiError && (
          <div className="auth-error-banner" role="alert">
            <span>❌</span> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            id="login-email"
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="name@hospital.com"
            required
            autoComplete="email"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="auth-submit-btn"
          >
            Sign In →
          </Button>
        </form>

        <p className="auth-demo-hint">
          🔑 <strong>Demo login:</strong> admin@medcore.hms / Admin@MedCore2026
        </p>

        <p className="auth-footer-note">
          🔒 HIPAA Compliant · Role-Based Access · Encrypted Sessions
        </p>
      </div>
    </div>
  );
}
