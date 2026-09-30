import React, { useState } from 'react';
import { X, Lock, Mail, Shield, UserCheck, ArrowRight } from 'lucide-react';
import { rolesData } from '../data/rolesData';

export const AuthModal = ({ mode = 'signin', onClose, onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState('dr.chen@medcore.health');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState('doctor');

  const handleSubmit = (e) => {
    e.preventDefault();
    const roleObj = rolesData.find((r) => r.id === selectedRole) || rolesData[0];
    onLoginSuccess(roleObj);
  };

  const handleQuickDemo = (roleId) => {
    const roleObj = rolesData.find((r) => r.id === roleId) || rolesData[0];
    onLoginSuccess(roleObj);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          style={{ position: 'absolute', top: '18px', right: '18px' }}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="auth-title">
          {authMode === 'signin' ? 'Sign In to MedCore HMS' : 'Start MedCore Cloud'}
        </h2>
        <p className="auth-subtitle">
          {authMode === 'signin'
            ? 'Access your role-specific clinical and operations portal'
            : 'Deploy a unified healthcare management instance for your hospital'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Select Role / Department</label>
            <select
              className="auth-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {rolesData.map((r) => (
                <option key={r.id} value={r.id} style={{ background: '#091a29', color: '#fff' }}>
                  {r.title} Workspace ({r.subtitle})
                </option>
              ))}
              <option value="admin" style={{ background: '#091a29', color: '#fff' }}>
                Hospital Chief Administrator
              </option>
            </select>
          </div>

          <div className="auth-form-group">
            <label>Hospital Email / Staff ID</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="auth-input"
                style={{ width: '100%' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff.id@medcore.health"
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label>Security Key / Password</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {authMode === 'signin' ? 'Launch Workspace' : 'Create Free Hospital Instance'}
          </button>
        </form>

        {/* Quick 1-click Demo Access */}
        <div className="demo-credentials-box">
          <div style={{ fontWeight: '700', color: '#00d2b4', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={14} /> One-Click Role Demo:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {rolesData.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickDemo(r.id)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                {r.title} &rarr;
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          {authMode === 'signin' ? (
            <>
              New healthcare facility?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                style={{ background: 'none', border: 'none', color: '#00d2b4', cursor: 'pointer', fontWeight: '600' }}
              >
                Get Started &rarr;
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                style={{ background: 'none', border: 'none', color: '#00d2b4', cursor: 'pointer', fontWeight: '600' }}
              >
                Sign In &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
