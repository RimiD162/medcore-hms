import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  ShieldAlert,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Activity,
  HeartPulse,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistEmergencyPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    priority: 'CRITICAL',
    reason: '',
    gender: 'Male',
    age: '',
    contactPhone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchEmergencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getEmergencies();
      setEmergencies(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load emergency queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const handleFastEmergencySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        patientName: formData.patientName,
        priority: formData.priority,
        reason: formData.reason,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        contactPhone: formData.contactPhone || undefined,
        notes: formData.notes || undefined,
      };

      const res = await receptionistApi.createEmergency(payload);
      const data = res.data || res;

      if (onShowToast) {
        onShowToast(`Emergency ${data.emergencyNumber} registered for ${data.patientName}! Patient record created.`);
      }

      // Reset form
      setFormData({
        patientName: '',
        priority: 'CRITICAL',
        reason: '',
        gender: 'Male',
        age: '',
        contactPhone: '',
        notes: '',
      });

      fetchEmergencies();
    } catch (err) {
      setFormError(err.message || 'Failed to register emergency intake.');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalCount = emergencies.filter((e) => e.priority === 'CRITICAL' && e.status === 'TRIAGED').length;
  const urgentCount = emergencies.filter((e) => e.priority === 'URGENT' && e.status === 'TRIAGED').length;

  return (
    <div className="med-page-container">
      {/* 1. Trauma Header Banner */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(6, 19, 31, 0.8))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              }}
            >
              <AlertCircle size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  Fast-Path Emergency Intake Desk
                </h2>
                <Badge variant="danger">{criticalCount} Critical Active</Badge>
                <Badge variant="amber">{urgentCount} Urgent Active</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Rapid triage registration generating instant EMG-YYYY-NNN tracking & auto-provisioned patient file.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchEmergencies}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Feed
          </Button>
        </div>
      </Card>

      {/* 2. Split Screen: Fast Intake Form (Left) & Live Emergency Queue (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Rapid Intake Form */}
        <Card title="Register Fast-Path Emergency Patient">
          {formError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '16px', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleFastEmergencySubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="med-form-label">Patient Name or Trauma Label *</label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. John Doe (Trauma Bay 1) or Eleanor Vance"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>

              <div>
                <label className="med-form-label">Triage Priority Level *</label>
                <select
                  className="med-form-select"
                  style={{ width: '100%', borderColor: formData.priority === 'CRITICAL' ? '#ef4444' : undefined }}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
                  <option value="URGENT">🟠 URGENT (Severe Pain / Unstable)</option>
                  <option value="SEMI_URGENT">🟡 SEMI-URGENT (Moderate Risk)</option>
                  <option value="NON_URGENT">🔵 NON-URGENT (Minor Walk-In)</option>
                </select>
              </div>

              <div>
                <label className="med-form-label">Gender</label>
                <select
                  className="med-form-select"
                  style={{ width: '100%' }}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Unknown</option>
                </select>
              </div>

              <div>
                <label className="med-form-label">Approximate Age</label>
                <input
                  type="number"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 35"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div>
                <label className="med-form-label">Contact / Accompanying Phone</label>
                <input
                  type="tel"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="+91 99887 76655"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="med-form-label">Chief Trauma Reason / Acute Complaint *</label>
                <textarea
                  className="med-form-textarea"
                  rows={2}
                  style={{ width: '100%' }}
                  placeholder="e.g. Motor vehicle collision, acute hemorrhage, suspected myocardial infarction"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" variant="danger" disabled={submitting} style={{ width: '100%' }}>
              <AlertCircle size={16} style={{ marginRight: '6px' }} />
              {submitting ? 'Registering Trauma Intake...' : 'Fast-Track Emergency Intake'}
            </Button>
          </form>
        </Card>

        {/* Right Column: Active Emergency Queue */}
        <Card title="Active Emergency Triage Registry">
          {loading ? (
            <LoadingState message="Loading live emergency feed..." />
          ) : emergencies.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 8px', color: '#10b981' }} />
              <p>No emergency cases currently pending triage.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {emergencies.map((emg) => (
                <div
                  key={emg.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background:
                      emg.priority === 'CRITICAL'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(245, 158, 11, 0.05)',
                    border:
                      emg.priority === 'CRITICAL'
                        ? '1px solid rgba(239, 68, 68, 0.25)'
                        : '1px solid rgba(245, 158, 11, 0.18)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
                        {emg.patientName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#00d2b4', fontWeight: '600' }}>
                        {emg.emergencyNumber} &bull; {emg.patient?.patientIdNumber}
                      </div>
                    </div>
                    <Badge variant={emg.priority === 'CRITICAL' ? 'danger' : 'amber'}>
                      {emg.priority}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #f8fafc)', marginBottom: '8px' }}>
                    {emg.reason}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <span>Registered: {new Date(emg.createdAt).toLocaleTimeString()}</span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/app/receptionist/patients/${emg.patientId}`)}
                    >
                      Patient Profile &rarr;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReceptionistEmergencyPage;
