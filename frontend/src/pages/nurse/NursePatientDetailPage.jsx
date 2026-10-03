import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Activity,
  ClipboardList,
  Pill,
  BedDouble,
  FileText,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  Phone,
  User,
  HeartPulse,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, Tabs, Modal, InputField, TextareaField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NursePatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('vitals');

  // Modal States
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionMedTask, setActionMedTask] = useState(null);
  const [medActionType, setMedActionType] = useState('ADMINISTER'); // ADMINISTER, HOLD, MISS
  const [medReason, setMedReason] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form States for New Vitals
  const [vitalForm, setVitalForm] = useState({
    bloodPressure: '120/80',
    temperature: 98.6,
    pulse: 72,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: 70,
    height: 170,
    observation: '',
  });

  // Form States for New Note
  const [noteForm, setNoteForm] = useState({
    shift: 'Morning Shift (07:00 - 15:00)',
    observation: '',
    careProvided: '',
    patientResponse: '',
    additionalNotes: '',
    isFlagged: false,
  });

  const { data: patient, loading, error, refetch } = useNurseData(
    () => nurseApi.getPatientDetail(patientId),
    [patientId]
  );

  if (loading) {
    return <LoadingState message="Loading Patient Clinical EMR Record..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (!patient) {
    return <EmptyState title="Patient not found" description="The requested patient record could not be loaded." />;
  }

  const activeAdmission = patient.admissions?.find((a) => a.status === 'ADMITTED') || patient.admissions?.[0];
  const vitals = patient.vitalSigns || [];
  const notes = patient.nursingNotes || [];
  const medTasks = patient.medicationAdministrations || [];
  const prescriptions = patient.prescriptions || [];
  const labReports = patient.labReports || [];

  // Handle Vital Submission
  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await nurseApi.recordVitals({
        patientId,
        bloodPressure: vitalForm.bloodPressure,
        temperature: parseFloat(vitalForm.temperature),
        pulse: parseInt(vitalForm.pulse, 10),
        respiratoryRate: parseInt(vitalForm.respiratoryRate, 10),
        oxygenSaturation: parseInt(vitalForm.oxygenSaturation, 10),
        weight: vitalForm.weight ? parseFloat(vitalForm.weight) : null,
        height: vitalForm.height ? parseFloat(vitalForm.height) : null,
        observation: vitalForm.observation || null,
      });
      if (onShowToast) onShowToast('Vital signs recorded successfully.');
      setShowVitalModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Note Submission
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await nurseApi.createNote({
        patientId,
        shift: noteForm.shift,
        observation: noteForm.observation,
        careProvided: noteForm.careProvided,
        patientResponse: noteForm.patientResponse,
        additionalNotes: noteForm.additionalNotes || null,
        isFlagged: noteForm.isFlagged,
      });
      if (onShowToast) onShowToast('Clinical nursing note saved.');
      setShowNoteModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Medication Action (Administer / Hold / Miss)
  const handleMedAction = async () => {
    if (!actionMedTask) return;
    try {
      setSubmitting(true);
      if (medActionType === 'ADMINISTER') {
        await nurseApi.administerMedication(actionMedTask.id, { notes: medNotes });
        if (onShowToast) onShowToast(`Marked ${actionMedTask.medicineName} as Administered.`);
      } else if (medActionType === 'HOLD') {
        if (!medReason) {
          if (onShowToast) onShowToast('Reason is required to hold medication');
          return;
        }
        await nurseApi.holdMedication(actionMedTask.id, { reason: medReason, notes: medNotes });
        if (onShowToast) onShowToast(`Marked ${actionMedTask.medicineName} as Held.`);
      } else if (medActionType === 'MISS') {
        if (!medReason) {
          if (onShowToast) onShowToast('Reason is required to mark medication as missed');
          return;
        }
        await nurseApi.missMedication(actionMedTask.id, { reason: medReason, notes: medNotes });
        if (onShowToast) onShowToast(`Marked ${actionMedTask.medicineName} as Missed.`);
      }
      setActionMedTask(null);
      setMedReason('');
      setMedNotes('');
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Top Back Navigation */}
      <button
        type="button"
        onClick={() => navigate('/app/nurse/patients')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#00d2b4', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}
      >
        <ArrowLeft size={16} /> Back to Inpatient Directory
      </button>

      {/* Patient Header Banner */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(15, 34, 53, 0.8), rgba(9, 26, 41, 0.95))', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d2b4, #00897b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800' }}>
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                  {patient.fullName}
                </h1>
                <Badge variant="blue">{patient.patientIdNumber}</Badge>
                {activeAdmission && <Badge variant="emerald">{activeAdmission.status}</Badge>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                <span>Age: <strong>{patient.age}y</strong></span>
                <span>Gender: <strong>{patient.gender}</strong></span>
                <span>Blood Group: <strong style={{ color: '#00d2b4' }}>{patient.bloodGroup || 'N/A'}</strong></span>
                <span>Phone: <strong>{patient.phone}</strong></span>
                {patient.emergencyContact && (
                  <span>Emergency: <strong>{patient.emergencyContact} ({patient.emergencyPhone || 'N/A'})</strong></span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={() => setShowVitalModal(true)}>
              <Activity size={14} style={{ marginRight: '6px' }} /> Record Vitals
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowNoteModal(true)}>
              <ClipboardList size={14} style={{ marginRight: '6px' }} /> Add Nursing Note
            </Button>
          </div>
        </div>

        {/* High-Visibility Allergies Warning Banner */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#ef4444" />
            <div>
              <span style={{ fontWeight: '800', color: '#f87171', fontSize: '0.88rem' }}>DOCUMENTED ALLERGIES: </span>
              <span style={{ color: '#fecaca', fontSize: '0.88rem', fontWeight: '600' }}>
                {patient.allergies.join(', ')}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'vitals', label: `Vital Signs History (${vitals.length})`, icon: Activity },
          { id: 'notes', label: `Nursing Clinical Notes (${notes.length})`, icon: ClipboardList },
          { id: 'emar', label: `e-MAR Medications (${medTasks.length})`, icon: Pill },
          { id: 'admission', label: 'Admission & Bed Details', icon: BedDouble },
          { id: 'prescriptions', label: `Doctor Prescriptions (${prescriptions.length})`, icon: FileText },
        ]}
      />

      {/* Tab 1: Vital Signs Timeline */}
      {activeTab === 'vitals' && (
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Vital Signs Chronological Records</h3>
            <Button size="sm" variant="primary" onClick={() => setShowVitalModal(true)}>
              <Activity size={14} style={{ marginRight: '6px' }} /> Log New Vitals
            </Button>
          </div>

          {vitals.length === 0 ? (
            <EmptyState title="No vital signs recorded" description="Click 'Log New Vitals' to capture baseline observations." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Blood Pressure</th>
                    <th>Pulse (HR)</th>
                    <th>Temperature</th>
                    <th>SpO2 (%)</th>
                    <th>Resp. Rate</th>
                    <th>Observation / Flags</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((v) => (
                    <tr key={v.id} style={{ background: v.isFlagged ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {new Date(v.recordedAt).toLocaleDateString()}
                        </div>
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
                      <td>{v.temperature}°F</td>
                      <td>
                        <span style={{ color: v.oxygenSaturation < 95 ? '#f87171' : '#34d399', fontWeight: '700' }}>
                          {v.oxygenSaturation}%
                        </span>
                      </td>
                      <td>{v.respiratoryRate}/min</td>
                      <td>
                        {v.isFlagged ? (
                          <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: '600' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {v.flagReason}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem' }}>
                            {v.observation || 'Normal baseline'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {v.nurse?.user?.fullName || 'Duty Nurse'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Nursing Clinical Notes */}
      {activeTab === 'notes' && (
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Clinical Nursing Care Log</h3>
            <Button size="sm" variant="primary" onClick={() => setShowNoteModal(true)}>
              <ClipboardList size={14} style={{ marginRight: '6px' }} /> Add Note
            </Button>
          </div>

          {notes.length === 0 ? (
            <EmptyState title="No nursing notes yet" description="Add nursing observations and care notes." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: n.isFlagged ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                    border: n.isFlagged ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge variant={n.isFlagged ? 'rose' : 'teal'}>{n.shift || 'Shift Care'}</Badge>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Logged by: <strong style={{ color: 'var(--text-main, #fff)' }}>{n.nurse?.user?.fullName || 'Duty Nurse'}</strong>
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: '700', color: '#00d2b4' }}>Clinical Observation:</span>
                      <p style={{ margin: '3px 0 0', color: 'var(--text-main, #fff)', lineHeight: '1.4' }}>{n.observation}</p>
                    </div>
                    <div>
                      <span style={{ fontWeight: '700', color: '#38bdf8' }}>Nursing Care Provided:</span>
                      <p style={{ margin: '3px 0 0', color: 'var(--text-main, #fff)', lineHeight: '1.4' }}>{n.careProvided}</p>
                    </div>
                    <div>
                      <span style={{ fontWeight: '700', color: '#a78bfa' }}>Patient Response:</span>
                      <p style={{ margin: '3px 0 0', color: 'var(--text-main, #fff)', lineHeight: '1.4' }}>{n.patientResponse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Medication Administration (e-MAR) */}
      {activeTab === 'emar' && (
        <Card style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Patient e-MAR Administration Schedule</h3>
            <Badge variant="teal">{medTasks.length} Total Prescribed Tasks</Badge>
          </div>

          {medTasks.length === 0 ? (
            <EmptyState title="No medication tasks" description="No active scheduled doses for this patient." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Medication & Dosage</th>
                    <th>Route & Freq</th>
                    <th>Scheduled Time</th>
                    <th>Status</th>
                    <th>Administered At / Signed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong style={{ fontSize: '0.92rem' }}>{task.medicineName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Dose: {task.dosage}
                        </div>
                      </td>
                      <td>
                        <Badge variant="blue">{task.route}</Badge>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                          {task.frequency || 'Scheduled'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {new Date(task.scheduledAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            task.status === 'ADMINISTERED'
                              ? 'emerald'
                              : task.status === 'DUE'
                              ? 'amber'
                              : task.status === 'HELD'
                              ? 'purple'
                              : task.status === 'MISSED'
                              ? 'rose'
                              : 'blue'
                          }
                        >
                          {task.status}
                        </Badge>
                        {task.reason && (
                          <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '3px' }}>
                            Reason: {task.reason}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {task.administeredAt ? (
                          <>
                            <div style={{ color: '#34d399', fontWeight: '600' }}>
                              {new Date(task.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ color: 'var(--text-muted, #94a3b8)' }}>
                              Signed: {task.nurse?.user?.fullName || 'RN'}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Pending administration</span>
                        )}
                      </td>
                      <td>
                        {['SCHEDULED', 'DUE'].includes(task.status) && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setActionMedTask(task);
                                setMedActionType('ADMINISTER');
                              }}
                            >
                              Administer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActionMedTask(task);
                                setMedActionType('HOLD');
                              }}
                            >
                              Hold
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setActionMedTask(task);
                                setMedActionType('MISS');
                              }}
                            >
                              Miss
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Admission & Bed Details */}
      {activeTab === 'admission' && (
        <Card style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '700' }}>Inpatient Admission Information</h3>

          {activeAdmission ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Admission Number:</span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#00d2b4', marginTop: '2px' }}>
                  {activeAdmission.admissionNumber}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Ward & Bed Location:</span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff', marginTop: '2px' }}>
                  {activeAdmission.ward} &bull; Room {activeAdmission.roomNumber} &bull; {activeAdmission.bedNumber}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Admission Date:</span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff', marginTop: '2px' }}>
                  {new Date(activeAdmission.admittedDate).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Attending Physician:</span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#38bdf8', marginTop: '2px' }}>
                  {activeAdmission.attendingDoctor || 'Dr. Sarah Chen'}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Admitting Diagnosis:</span>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff', marginTop: '2px' }}>
                  {activeAdmission.admittingDiagnosis || 'Under Medical Observation'}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No active admission" description="This patient is currently not admitted as an inpatient." />
          )}
        </Card>
      )}

      {/* Tab 5: Doctor Prescriptions */}
      {activeTab === 'prescriptions' && (
        <Card style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: '700' }}>Active Doctor Prescriptions (Read-Only)</h3>

          {prescriptions.length === 0 ? (
            <EmptyState title="No prescriptions" description="No prescription records available." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prescriptions.map((rx) => (
                <div key={rx.id} style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: '#00d2b4' }}>{rx.prescriptionNumber}</span>
                    <Badge variant="emerald">{rx.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '8px' }}>
                    Prescribed by: {rx.doctor?.user?.fullName || 'Attending Doctor'} &bull; {new Date(rx.prescribedDate).toLocaleDateString()}
                  </div>
                  {rx.items && rx.items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {rx.items.map((item) => (
                        <span key={item.id} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', fontSize: '0.78rem' }}>
                          <strong>{item.medicineName}</strong> ({item.dosage} &bull; {item.frequency})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Modal: Record Vitals ── */}
      {showVitalModal && (
        <Modal
          isOpen={showVitalModal}
          onClose={() => setShowVitalModal(false)}
          title="Record Inpatient Vital Signs"
        >
          <form onSubmit={handleRecordVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField
                label="Blood Pressure (Systolic/Diastolic)"
                placeholder="120/80"
                value={vitalForm.bloodPressure}
                onChange={(e) => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })}
                required
              />
              <InputField
                label="Pulse / Heart Rate (bpm)"
                type="number"
                placeholder="72"
                value={vitalForm.pulse}
                onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })}
                required
              />
              <InputField
                label="Body Temp (°F)"
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitalForm.temperature}
                onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                required
              />
              <InputField
                label="SpO2 Saturation (%)"
                type="number"
                placeholder="98"
                value={vitalForm.oxygenSaturation}
                onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })}
                required
              />
              <InputField
                label="Respiratory Rate (/min)"
                type="number"
                placeholder="16"
                value={vitalForm.respiratoryRate}
                onChange={(e) => setVitalForm({ ...vitalForm, respiratoryRate: e.target.value })}
                required
              />
              <InputField
                label="Weight (kg)"
                type="number"
                step="0.5"
                placeholder="70"
                value={vitalForm.weight}
                onChange={(e) => setVitalForm({ ...vitalForm, weight: e.target.value })}
              />
            </div>

            <TextareaField
              label="Clinical Observations / State"
              placeholder="e.g. Patient resting comfortably, alert and oriented x 3..."
              value={vitalForm.observation}
              onChange={(e) => setVitalForm({ ...vitalForm, observation: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setShowVitalModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Vital Signs'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Add Nursing Note ── */}
      {showNoteModal && (
        <Modal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          title="Add Clinical Nursing Note"
        >
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <InputField
              label="Shift Roster"
              value={noteForm.shift}
              onChange={(e) => setNoteForm({ ...noteForm, shift: e.target.value })}
              required
            />
            <TextareaField
              label="1. Clinical Observation (Findings)"
              placeholder="Detailed physical observation of patient status, wound appearance, consciousness..."
              value={noteForm.observation}
              onChange={(e) => setNoteForm({ ...noteForm, observation: e.target.value })}
              required
            />
            <TextareaField
              label="2. Nursing Care Provided (Interventions)"
              placeholder="Care procedures performed (e.g. IV line flush, wound dressing change, assisted feeding)..."
              value={noteForm.careProvided}
              onChange={(e) => setNoteForm({ ...noteForm, careProvided: e.target.value })}
              required
            />
            <TextareaField
              label="3. Patient Response"
              placeholder="Patient feedback, pain score post-intervention, tolerance..."
              value={noteForm.patientResponse}
              onChange={(e) => setNoteForm({ ...noteForm, patientResponse: e.target.value })}
              required
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="flagNote"
                checked={noteForm.isFlagged}
                onChange={(e) => setNoteForm({ ...noteForm, isFlagged: e.target.checked })}
              />
              <label htmlFor="flagNote" style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '600', cursor: 'pointer' }}>
                Flag for Attending Doctor Attention
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setShowNoteModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Clinical Note'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Medication Action (Administer / Hold / Miss) ── */}
      {actionMedTask && (
        <Modal
          isOpen={!!actionMedTask}
          onClose={() => setActionMedTask(null)}
          title={`e-MAR Action: ${medActionType} ${actionMedTask.medicineName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))', fontSize: '0.88rem' }}>
              Dose: <strong>{actionMedTask.dosage}</strong> &bull; Route: <strong>{actionMedTask.route}</strong> &bull; Scheduled: <strong>{new Date(actionMedTask.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>

            {['HOLD', 'MISS'].includes(medActionType) && (
              <InputField
                label={`Mandatory Clinical Reason to ${medActionType === 'HOLD' ? 'Hold' : 'Mark Missed'}`}
                placeholder="e.g. Patient NPO for surgery / Patient undergoing radiology scan / Low BP..."
                value={medReason}
                onChange={(e) => setMedReason(e.target.value)}
                required
              />
            )}

            <TextareaField
              label="Nursing Notes / Remarks"
              placeholder="Additional administration notes (optional)..."
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setActionMedTask(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={medActionType === 'ADMINISTER' ? 'primary' : 'outline'}
                onClick={handleMedAction}
                disabled={submitting}
              >
                {submitting ? 'Updating...' : `Confirm ${medActionType}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NursePatientDetailPage;
