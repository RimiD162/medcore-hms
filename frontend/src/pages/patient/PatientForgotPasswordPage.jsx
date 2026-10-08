import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  ArrowLeft,
  Lock,
  Building,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';

export const PatientForgotPasswordPage = () => {
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
            <ShieldAlert size={30} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Account Password Assistance
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
            Protected Health Information (PHI) Security Policy
          </p>
        </div>

        {/* Guidance Content */}
        <div style={{
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          borderRadius: 14,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          fontSize: '0.86rem',
          color: '#cbd5e1',
          lineHeight: 1.5,
        }}>
          <p style={{ margin: 0 }}>
            To safeguard your private medical consultations, diagnostic lab results, and prescriptions against unauthorized access, automated email password reset links are restricted.
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: '#ffffff' }}>
            To reset your portal password or reactivate your account, please use one of the following verified options:
          </p>
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{
            backgroundColor: 'rgba(6, 20, 32, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PhoneCall size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>Call Patient Helpdesk</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>+1 (555) 389-2910 &bull; 24/7 Identity Verification Desk</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(6, 20, 32, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(5, 150, 105, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>Visit Hospital Front Desk</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Present photo ID at Main Reception Counter 1</div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <Link
            to="/portal/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#38bdf8',
              fontSize: '0.86rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Patient Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientForgotPasswordPage;
