import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  Calendar,
  User,
  Stethoscope,
  Clock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientPrescriptionDetailPage = () => {
  const { prescriptionId } = useParams();
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await patientApi.getPrescriptionById(prescriptionId);
        if (res.data && res.data.prescription) {
          setPrescription(res.data.prescription);
        } else {
          setError('Prescription not found');
        }
      } catch (err) {
        setError(err.message || 'Unable to load prescription');
      } finally {
        setLoading(false);
      }
    }

    if (prescriptionId) {
      fetchDetail();
    }
  }, [prescriptionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: 60, borderRadius: 12, backgroundColor: 'rgba(5, 150, 105, 0.08)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 350, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }} />
      </div>
    );
  }

  if (error || !prescription) {
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
          Prescription Record Not Found
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)', maxWidth: 460 }}>
          {error || 'The requested e-prescription could not be located or you do not have permission to access it.'}
        </p>
        <Link
          to="/app/patient/prescriptions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Prescriptions</span>
        </Link>
      </div>
    );
  }

  const dateFormatted = prescription.date ? new Date(prescription.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Prescription Date';

  const isActive = prescription.status === 'ACTIVE';

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
          to="/app/patient/prescriptions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#059669',
            textDecoration: 'none',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Prescriptions</span>
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
            <span>Print E-Prescription</span>
          </button>
        </div>
      </div>

      {/* ── Printable Prescription Slip ──────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
      }}>
        {/* Header Header Strip */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
                {prescription.prescriptionNumber || `RX-${prescription.id?.substring(0, 8).toUpperCase()}`}
              </span>
              <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                {dateFormatted}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Official Digital E-Prescription
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
              Prescribing Physician
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {prescription.doctorName ? `Dr. ${prescription.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Physician'}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
              {prescription.doctorDepartment || 'General Medicine'}
            </div>
          </div>
        </div>

        {/* Prescription Details Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Status & Diagnosis */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--subcard-bg, #f8fafc)',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                Indication / Diagnosis
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.15rem' }}>
                {prescription.diagnosis || 'Clinical Prescription Review'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>Prescription Status:</span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: 20,
                backgroundColor: isActive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                color: isActive ? '#059669' : '#64748b',
                textTransform: 'uppercase',
              }}>
                {prescription.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Itemized Medications Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Pill size={18} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                Prescribed Medications & Administration Schedule
              </h3>
            </div>

            <div style={{
              overflowX: 'auto',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 12,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--subcard-bg, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>#</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Medicine Name</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Dosage</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Frequency & Timing</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Duration</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Route</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Dispensing</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items && prescription.items.length > 0 ? (
                    prescription.items.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{item.medicineName}</div>
                          {item.instructions && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
                              Note: {item.instructions}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #334155)', fontWeight: 600 }}>{item.dosage || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #334155)' }}>{item.frequency || 'As directed'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 600 }}>{item.duration || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)' }}>{item.route || 'Oral'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            backgroundColor: item.isDispensed ? 'rgba(5, 150, 105, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: item.isDispensed ? '#059669' : '#d97706',
                          }}>
                            {item.isDispensed ? 'Dispensed' : 'Ready / Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                        No medication items listed in this prescription.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Instructions */}
          {prescription.generalInstructions && (
            <div style={{
              backgroundColor: 'rgba(5, 150, 105, 0.05)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid rgba(5, 150, 105, 0.2)',
            }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                Physician General Advisory
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary, #334155)', lineHeight: 1.5 }}>
                {prescription.generalInstructions}
              </p>
            </div>
          )}

          {/* Dispensing History if any */}
          {prescription.dispensings && prescription.dispensings.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Building size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Hospital Pharmacy Dispensing Logs
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {prescription.dispensings.map((disp, idx) => (
                  <div
                    key={disp.id || idx}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      backgroundColor: 'var(--subcard-bg, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Dispensed by <strong>{disp.pharmacistName || 'Central Pharmacy Staff'}</strong></span>
                    <span style={{ color: 'var(--text-secondary, #64748b)' }}>
                      {disp.dispensedAt ? new Date(disp.dispensedAt).toLocaleString() : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Disclaimer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 10,
            backgroundColor: 'rgba(5, 150, 105, 0.04)',
            border: '1px solid rgba(5, 150, 105, 0.15)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary, #64748b)',
          }}>
            <ShieldCheck size={18} color="#059669" />
            <span>
              <strong>Clinical Note:</strong> Take medications strictly as prescribed by your attending doctor. Do not alter dosage, skip doses, or share prescribed medications with others without clinical consultation.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptionDetailPage;
