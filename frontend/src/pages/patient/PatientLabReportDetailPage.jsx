import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Microscope,
  Calendar,
  User,
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
  Download,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientLabReportDetailPage = () => {
  const { reportId } = useParams();
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await patientApi.getLabReportById(reportId);
        if (res.data && res.data.report) {
          setReport(res.data.report);
        } else {
          setError('Laboratory report not found');
        }
      } catch (err) {
        setError(err.message || 'Unable to load diagnostic laboratory report');
      } finally {
        setLoading(false);
      }
    }

    if (reportId) {
      fetchDetail();
    }
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: 60, borderRadius: 12, backgroundColor: 'rgba(124, 58, 237, 0.08)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 350, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }} />
      </div>
    );
  }

  if (error || !report) {
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
          Laboratory Diagnostic Report Not Found
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)', maxWidth: 460 }}>
          {error || 'The requested diagnostic lab report does not exist or has not been released by pathology.'}
        </p>
        <Link
          to="/app/patient/lab-reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Lab Reports</span>
        </Link>
      </div>
    );
  }

  const releasedDateFormatted = report.releasedAt ? new Date(report.releasedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Verified Report';

  const isAmended = report.isAmended || report.status === 'AMENDED';

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
          to="/app/patient/lab-reports"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#7c3aed',
            textDecoration: 'none',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Lab Reports</span>
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
            <span>Print Official PDF</span>
          </button>
        </div>
      </div>

      {/* ── Report Card ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
      }}>
        {/* Header Header Strip */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
                Order #{report.orderNumber || report.id?.substring(0, 8)}
              </span>
              <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                {releasedDateFormatted}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              {report.testName || 'Diagnostic Laboratory Report'}
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
              Pathology Laboratory
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {report.category || 'Clinical Pathology'}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
              {report.verifyingPathologist ? `Verified by ${report.verifyingPathologist}` : 'Verified Clinical Panel'}
            </div>
          </div>
        </div>

        {/* Report Details Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Amended Notification Alert if applicable */}
          {isAmended && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}>
              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#b91c1c' }}>
                  Amended Laboratory Report Notice
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                  {report.amendedReason || 'This report was updated by the pathology laboratory following secondary clinical review.'}
                  {report.amendedAt && (
                    <span style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.78rem', color: '#991b1b' }}>
                      Amendment Timestamp: {new Date(report.amendedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Test Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--subcard-bg, #f8fafc)',
            borderRadius: 12,
            padding: '1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                Ordered By
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.15rem' }}>
                {report.doctorName ? `Dr. ${report.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Clinical Physician'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                Sample Collection Date
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginTop: '0.15rem' }}>
                {report.sampleCollectionDate ? new Date(report.sampleCollectionDate).toLocaleDateString() : 'Recorded at Collection'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                Performing Technologist
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginTop: '0.15rem' }}>
                {report.performingTechnician || 'Central Lab Analyst'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                Release Status
              </span>
              <div style={{ marginTop: '0.15rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 20,
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  color: '#7c3aed',
                  textTransform: 'uppercase',
                }}>
                  {report.status || 'RELEASED'}
                </span>
              </div>
            </div>
          </div>

          {/* Parameters Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Microscope size={18} color="#7c3aed" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                Observed Diagnostic Biomarkers & Quantitative Results
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
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Parameter Name</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Observed Value</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Unit</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Reference Range</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Assessment Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parameters && report.parameters.length > 0 ? (
                    report.parameters.map((param, idx) => {
                      const isAbnormal = param.flag && param.flag !== 'NORMAL';
                      return (
                        <tr
                          key={param.id || idx}
                          style={{
                            borderBottom: '1px solid var(--border-color, #f1f5f9)',
                            backgroundColor: isAbnormal ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{param.parameterName}</div>
                            {param.interpretation && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
                                {param.interpretation}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: isAbnormal ? '#ef4444' : 'var(--text-primary, #0f172a)', fontWeight: 800, fontSize: '0.95rem' }}>
                            {param.value}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)' }}>{param.unit || '—'}</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #334155)', fontWeight: 500 }}>{param.referenceRange || 'Standard reference'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: 6,
                              backgroundColor: isAbnormal ? 'rgba(239, 68, 68, 0.12)' : 'rgba(5, 150, 105, 0.1)',
                              color: isAbnormal ? '#ef4444' : '#059669',
                            }}>
                              {param.flag || 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                        No individual parameter data available for this report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pathology Comments */}
          {report.notes && (
            <div style={{
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.92rem', fontWeight: 700, color: '#7c3aed' }}>
                Pathologist Clinical Comments & Impressions
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary, #334155)', lineHeight: 1.5 }}>
                {report.notes}
              </p>
            </div>
          )}

          {/* MANDATORY DISCLAIMER FOOTER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: 12,
            backgroundColor: 'rgba(124, 58, 237, 0.05)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            fontSize: '0.85rem',
            color: 'var(--text-primary, #1e293b)',
            lineHeight: 1.5,
          }}>
            <Info size={20} color="#7c3aed" style={{ flexShrink: 0 }} />
            <span>
              <strong>Clinical Reference Disclaimer:</strong> Flags compare values with the laboratory's configured reference information. Please discuss your results with your doctor.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientLabReportDetailPage;
