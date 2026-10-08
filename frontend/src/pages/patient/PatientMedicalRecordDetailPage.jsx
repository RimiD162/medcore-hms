import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  FileText,
  Calendar,
  User,
  Stethoscope,
  Activity,
  Heart,
  Pill,
  Microscope,
  FileCheck,
  Clock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientMedicalRecordDetailPage = () => {
  const { recordId } = useParams();
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await patientApi.getMedicalRecordById(recordId);
        if (res.data && res.data.record) {
          setRecord(res.data.record);
        } else {
          setError('Record not found');
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve clinical encounter record');
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      fetchDetail();
    }
  }, [recordId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: 60, borderRadius: 12, backgroundColor: 'rgba(2, 132, 199, 0.08)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 350, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }} />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 16,
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <AlertCircle size={40} color="#ef4444" />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
          Clinical Encounter Record Not Found
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)', maxWidth: 460 }}>
          {error || 'The requested clinical encounter record does not exist or you do not have permission to view it.'}
        </p>
        <Link
          to="/app/patient/medical-records"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Medical Records</span>
        </Link>
      </div>
    );
  }

  const visitDateFormatted = record.visitDate ? new Date(record.visitDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Recorded Encounter';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Top Bar & Actions ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <Link
          to="/app/patient/medical-records"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#0284c7',
            textDecoration: 'none',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Medical Records</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #1e293b)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Printer size={15} />
            <span>Print Clinical Summary</span>
          </button>
        </div>
      </div>

      {/* ── Main Clinical Encounter Card ─────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
      }}>
        {/* Card Header Header Strip */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.2rem 0.6rem',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Encounter #{record.id?.substring(0, 8) || 'RECORD'}
              </span>
              <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                {visitDateFormatted}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Clinical Consultation Summary
            </h1>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: '0.75rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
              Attending Physician
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {record.doctorName ? `Dr. ${record.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Physician'}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
              {record.doctorDepartment || 'General Medicine'}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Chief Complaint & Diagnosis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ClipboardList size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Primary Clinical Diagnosis
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0284c7' }}>
                {record.diagnosis || 'No primary diagnosis recorded'}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Chief Complaint & Presenting Symptoms
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary, #334155)', lineHeight: 1.5 }}>
                {record.chiefComplaint || 'Routine health review or follow-up visit.'}
              </p>
            </div>
          </div>

          {/* Section 2: Recorded Vitals Snapshot */}
          {record.vitals && Object.keys(record.vitals).length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Activity size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Vital Signs Recorded During Encounter
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
              }}>
                {record.vitals.bp && (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--subcard-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Blood Pressure</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '0.2rem' }}>{record.vitals.bp}</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>mmHg</span>
                  </div>
                )}
                {record.vitals.pulse && (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--subcard-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Pulse Rate</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', marginTop: '0.2rem' }}>{record.vitals.pulse}</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>bpm</span>
                  </div>
                )}
                {record.vitals.spo2 && (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--subcard-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Oxygen SpO2</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>{record.vitals.spo2}%</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>room air</span>
                  </div>
                )}
                {record.vitals.temp && (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--subcard-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Temperature</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '0.2rem' }}>{record.vitals.temp} °F</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>oral</span>
                  </div>
                )}
                {record.vitals.weight && (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'var(--subcard-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Weight</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '0.2rem' }}>{record.vitals.weight} kg</div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>measured</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Clinical Notes & Treatment Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {record.clinicalNotes && (
              <div style={{
                backgroundColor: 'var(--subcard-bg, #f8fafc)',
                borderRadius: 12,
                padding: '1.25rem',
                border: '1px solid var(--border-color, #e2e8f0)',
              }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Doctor Clinical Observations & Patient Advice
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary, #334155)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {record.clinicalNotes}
                </p>
              </div>
            )}

            {record.treatmentPlan && (
              <div style={{
                backgroundColor: 'rgba(2, 132, 199, 0.04)',
                borderRadius: 12,
                padding: '1.25rem',
                border: '1px solid rgba(2, 132, 199, 0.2)',
              }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7' }}>
                  Prescribed Treatment Plan & Follow-Up Instructions
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary, #334155)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {record.treatmentPlan}
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Prescriptions Linked to this Visit */}
          {record.prescriptions && record.prescriptions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Pill size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Medications Prescribed During Visit ({record.prescriptions.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {record.prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderRadius: 10,
                      backgroundColor: 'var(--subcard-bg, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #0f172a)' }}>
                          Prescription #{rx.id?.substring(0, 8)}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 6,
                          backgroundColor: rx.status === 'ACTIVE' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: rx.status === 'ACTIVE' ? '#059669' : '#64748b',
                        }}>
                          {rx.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.2rem' }}>
                        {rx.items?.length || 0} Medication(s) itemized
                      </div>
                    </div>

                    <Link
                      to={`/app/patient/prescriptions/${rx.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#059669',
                        textDecoration: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      }}
                    >
                      <span>View Medication Details</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Diagnostic Lab Orders Linked to this Visit */}
          {record.labOrders && record.labOrders.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Microscope size={18} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Diagnostic Pathology & Lab Tests Ordered ({record.labOrders.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {record.labOrders.map((lab) => (
                  <div
                    key={lab.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderRadius: 10,
                      backgroundColor: 'var(--subcard-bg, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #0f172a)' }}>
                          {lab.testName || lab.orderNumber || `Lab Order #${lab.id?.substring(0, 8)}`}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 6,
                          backgroundColor: lab.status === 'RELEASED' || lab.status === 'COMPLETED' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: lab.status === 'RELEASED' || lab.status === 'COMPLETED' ? '#7c3aed' : '#d97706',
                        }}>
                          {lab.status || 'PENDING'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.2rem' }}>
                        Category: {lab.category || 'Pathology'}
                      </div>
                    </div>

                    <Link
                      to={`/app/patient/lab-reports/${lab.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#7c3aed',
                        textDecoration: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: 6,
                        backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      }}
                    >
                      <span>View Diagnostic Report</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 10,
            backgroundColor: 'rgba(2, 132, 199, 0.04)',
            border: '1px solid rgba(2, 132, 199, 0.15)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary, #64748b)',
          }}>
            <ShieldCheck size={18} color="#0284c7" />
            <span>
              This is an official patient clinical summary. If you have questions about your diagnosis or treatment plan, please message your clinical care team or book a follow-up consultation.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientMedicalRecordDetailPage;
