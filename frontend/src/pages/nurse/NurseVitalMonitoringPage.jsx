import React, { useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import {
  Activity,
  PlusCircle,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit2,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, Modal, InputField, SelectField, TextareaField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseVitalMonitoringPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFlagged = queryParams.get('isFlagged') === 'true';

  const [isFlaggedFilter, setIsFlaggedFilter] = useState(initialFlagged);
  const [selectedPatientId, setSelectedPatientId] = useState(queryParams.get('patientId') || '');
  const [showModal, setShowModal] = useState(false);
  const [editingVital, setEditingVital] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    patientId: '',
    bloodPressure: '120/80',
    temperature: 98.6,
    pulse: 72,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: '',
    height: '',
    observation: '',
  });

  // Fetch Vitals Data
  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getVitals({ isFlagged: isFlaggedFilter, patientId: selectedPatientId || undefined }),
    [isFlaggedFilter, selectedPatientId]
  );

  // Fetch Assigned Patients for dropdown selection
  const { data: patientsData } = useNurseData(nurseApi.getAssignedPatients);
  const patientsList = patientsData?.patients || [];

  const vitalsList = data?.vitals || [];

  const handleOpenCreateModal = () => {
    setEditingVital(null);
    setForm({
      patientId: selectedPatientId || (patientsList[0]?.id || ''),
      bloodPressure: '120/80',
      temperature: 98.6,
      pulse: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: '',
      height: '',
      observation: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (v) => {
    setEditingVital(v);
    setForm({
      patientId: v.patientId,
      bloodPressure: v.bloodPressure,
      temperature: v.temperature,
      pulse: v.pulse,
      respiratoryRate: v.respiratoryRate,
      oxygenSaturation: v.oxygenSaturation,
      weight: v.weight || '',
      height: v.height || '',
      observation: v.observation || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingVital) {
        await nurseApi.correctVitalSign(editingVital.id, {
          bloodPressure: form.bloodPressure,
          temperature: parseFloat(form.temperature),
          pulse: parseInt(form.pulse, 10),
          respiratoryRate: parseInt(form.respiratoryRate, 10),
          oxygenSaturation: parseInt(form.oxygenSaturation, 10),
          weight: form.weight ? parseFloat(form.weight) : null,
          height: form.height ? parseFloat(form.height) : null,
          observation: form.observation || null,
        });
        if (onShowToast) onShowToast('Vital sign entry corrected.');
      } else {
        await nurseApi.recordVitals({
          patientId: form.patientId,
          bloodPressure: form.bloodPressure,
          temperature: parseFloat(form.temperature),
          pulse: parseInt(form.pulse, 10),
          respiratoryRate: parseInt(form.respiratoryRate, 10),
          oxygenSaturation: parseInt(form.oxygenSaturation, 10),
          weight: form.weight ? parseFloat(form.weight) : null,
          height: form.height ? parseFloat(form.height) : null,
          observation: form.observation || null,
        });
        if (onShowToast) onShowToast('Vital sign check logged.');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to save vitals');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#00d2b4" />
            Inpatient Vital Signs Monitoring
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time physiological observation & critical threshold monitoring
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreateModal}>
          <PlusCircle size={15} style={{ marginRight: '6px' }} /> Record New Vitals
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ minWidth: '240px' }}>
              <SelectField
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                options={[
                  { value: '', label: 'All Assigned Patients' },
                  ...patientsList.map((p) => ({ value: p.id, label: `${p.fullName} (${p.patientIdNumber})` })),
                ]}
                style={{ margin: 0 }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFlaggedFilter(!isFlaggedFilter)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: isFlaggedFilter ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                border: isFlaggedFilter ? '1px solid #ef4444' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: isFlaggedFilter ? '#f87171' : 'var(--text-main, #fff)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={14} />
              <span>Flagged / Abnormal Only</span>
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
            Showing <strong>{vitalsList.length}</strong> vital sign checks
          </div>
        </div>
      </Card>

      {/* Vitals Table */}
      <Card>
        {loading ? (
          <LoadingState message="Fetching vital signs..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : vitalsList.length === 0 ? (
          <EmptyState
            title="No vital sign checks found"
            description="Log vital signs or adjust filters to view records."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table">
              <thead>
                <tr>
                  <th>Patient Name & ID</th>
                  <th>Date & Time</th>
                  <th>Blood Pressure</th>
                  <th>Pulse (HR)</th>
                  <th>Temperature</th>
                  <th>SpO2</th>
                  <th>Resp. Rate</th>
                  <th>Status / Flags</th>
                  <th>Recorded By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vitalsList.map((v) => {
                  const hoursOld = (Date.now() - new Date(v.recordedAt).getTime()) / (1000 * 60 * 60);
                  const canEdit = hoursOld <= 2;

                  return (
                    <tr key={v.id} style={{ background: v.isFlagged ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                      <td>
                        <strong style={{ color: 'var(--text-main, #fff)' }}>{v.patient?.fullName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {v.patient?.patientIdNumber}
                        </div>
                      </td>
                      <td>
                        <div>{new Date(v.recordedAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: v.systolic >= 140 || v.diastolic >= 90 ? '#f87171' : 'inherit' }}>
                          {v.bloodPressure}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: v.pulse > 100 || v.pulse < 60 ? '#f87171' : 'inherit' }}>
                          {v.pulse} bpm
                        </span>
                      </td>
                      <td>
                        <span style={{ color: v.temperature >= 100.4 ? '#f87171' : 'inherit' }}>
                          {v.temperature}°F
                        </span>
                      </td>
                      <td>
                        <span style={{ color: v.oxygenSaturation < 95 ? '#f87171' : '#34d399', fontWeight: '700' }}>
                          {v.oxygenSaturation}%
                        </span>
                      </td>
                      <td>{v.respiratoryRate}/min</td>
                      <td>
                        {v.isFlagged ? (
                          <Badge variant="rose">
                            <AlertTriangle size={11} style={{ marginRight: '3px' }} /> Flagged
                          </Badge>
                        ) : (
                          <Badge variant="emerald">Normal</Badge>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {v.nurse?.user?.fullName || 'Duty Nurse'}
                      </td>
                      <td>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(v)}
                            title="Correct within 2-hour window"
                            style={{ background: 'none', border: 'none', color: '#00d2b4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record / Correct Vitals Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingVital ? 'Correct Vital Signs Record (Within 2-Hour Window)' : 'Record Inpatient Vital Signs'}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!editingVital && (
              <SelectField
                label="Select Patient"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                options={patientsList.map((p) => ({ value: p.id, label: `${p.fullName} (${p.patientIdNumber})` }))}
                required
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField
                label="Blood Pressure (Systolic/Diastolic)"
                placeholder="120/80"
                value={form.bloodPressure}
                onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                required
              />
              <InputField
                label="Pulse / HR (bpm)"
                type="number"
                placeholder="72"
                value={form.pulse}
                onChange={(e) => setForm({ ...form, pulse: e.target.value })}
                required
              />
              <InputField
                label="Body Temperature (°F)"
                type="number"
                step="0.1"
                placeholder="98.6"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                required
              />
              <InputField
                label="SpO2 Saturation (%)"
                type="number"
                placeholder="98"
                value={form.oxygenSaturation}
                onChange={(e) => setForm({ ...form, oxygenSaturation: e.target.value })}
                required
              />
              <InputField
                label="Respiratory Rate (/min)"
                type="number"
                placeholder="16"
                value={form.respiratoryRate}
                onChange={(e) => setForm({ ...form, respiratoryRate: e.target.value })}
                required
              />
              <InputField
                label="Weight (kg)"
                type="number"
                step="0.5"
                placeholder="70"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>

            <TextareaField
              label="Clinical Observation"
              placeholder="Observation on patient consciousness, skin color, comfort level..."
              value={form.observation}
              onChange={(e) => setForm({ ...form, observation: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingVital ? 'Save Correction' : 'Record Vitals'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NurseVitalMonitoringPage;
