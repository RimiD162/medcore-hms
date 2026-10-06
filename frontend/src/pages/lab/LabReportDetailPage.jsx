import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  User,
  Clock,
  FlaskConical,
  Activity,
  Microscope,
  Lock,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: report, loading, error, refetch } = useLabData(
    () => labApi.getReportById(id),
    [id]
  );

  const [verifying, setVerifying] = useState(false);
  const [comments, setComments] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const handleVerifyAndRelease = async () => {
    if (!report?.orderId) return;
    setVerifying(true);
    setFeedbackMsg(null);
    try {
      await labApi.verifyAndReleaseReport(report.orderId, {
        comments: comments || undefined,
      });
      setFeedbackMsg({ type: 'success', text: 'Diagnostic report verified, signed, and released to Doctor EMR.' });
      refetch();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to verify and release report';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingState message="Loading diagnostic report and findings..." />;
  if (error || !report) return <ErrorState message={error || 'Diagnostic report not found'} onRetry={refetch} />;

  const order = report.order || {};
  const patient = order.patient || {};
  const orderingDoctor = order.orderingDoctor || {};

  const getFlagBadgeVariant = (flag) => {
    switch (flag) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
      case 'LOW':
      case 'ABNORMAL':
        return 'warning';
      case 'NORMAL':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/reports')}>
            Back to Reports
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#8b5cf6' }}>{report.reportNumber}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="outline" icon={Printer} onClick={handlePrint}>
            Print / Export PDF
          </Button>

          {report.status !== 'RELEASED' && (
            <Button
              variant="primary"
              icon={ShieldCheck}
              disabled={verifying}
              onClick={handleVerifyAndRelease}
            >
              {verifying ? 'Signing & Releasing...' : 'Peer Verify & Release Report'}
            </Button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className="no-print"
          style={{
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Printable Clinical Diagnostic Laboratory Report Sheet */}
      <Card
        className="diagnostic-report-sheet"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Hospital Letterhead */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Microscope size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                MedCore Diagnostic Pathology & Biochemistry
              </h2>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Accredited Clinical Diagnostic Laboratories &bull; CAP/CLIA Certified Node #07
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#8b5cf6' }}>
              {report.reportNumber}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              <Badge variant={report.status === 'RELEASED' ? 'success' : 'warning'}>
                {report.status}
              </Badge>
              {report.isAmended && <Badge variant="warning">AMENDED</Badge>}
            </div>
          </div>
        </div>

        {/* Patient Demographics & Investigation Metadata Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>PATIENT NAME</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{patient.fullName || 'Patient Name'}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              MRN / ID: <strong>{patient.patientId || 'N/A'}</strong>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>AGE / GENDER</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {patient.age ? `${patient.age} Years` : 'Age N/A'} / {patient.gender || 'N/A'}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Contact: {patient.phone || 'On file'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>ORDERING CLINICIAN</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Dr. {orderingDoctor.user?.fullName || orderingDoctor.fullName || 'Staff Physician'}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dept: {orderingDoctor.department || 'Outpatient Clinic'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>ORDER & DRAW DATES</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Order: {order.orderNumber}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Released: {report.releasedAt ? new Date(report.releasedAt).toLocaleString() : 'Pending Release'}
            </div>
          </div>
        </div>

        {/* Structured Multi-Test Results Findings Table */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Diagnostic Investigation Findings
            </h3>
            <Badge variant={getFlagBadgeVariant(report.overallFlag)}>
              Overall Flag: {report.overallFlag || 'NORMAL'}
            </Badge>
          </div>

          {(!order.items || order.items.length === 0) ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No investigation findings recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {order.items.map((item) => {
                const res = item.result;
                return (
                  <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Item Header */}
                    <div style={{ background: 'rgba(124, 58, 237, 0.08)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FlaskConical size={16} color="#8b5cf6" />
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {item.test?.name} ({item.test?.code})
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          &bull; Category: {item.test?.category} &bull; Specimen: {item.test?.sampleType}
                        </span>
                      </div>

                      {res?.overallFlag && (
                        <Badge variant={getFlagBadgeVariant(res.overallFlag)}>
                          {res.overallFlag}
                        </Badge>
                      )}
                    </div>

                    {/* Parameters Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px' }}>Parameter Name</th>
                          <th style={{ padding: '8px 12px' }}>Observed Result</th>
                          <th style={{ padding: '8px 12px' }}>Unit</th>
                          <th style={{ padding: '8px 12px' }}>Reference Range</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Technical Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(res?.values || []).map((val) => (
                          <tr key={val.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {val.parameterName || val.parameterCode}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.95rem', color: val.flag === 'CRITICAL' ? '#ef4444' : 'var(--text-primary)' }}>
                              {val.numericValue !== null && val.numericValue !== undefined ? val.numericValue : val.textValue || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                              {val.unit || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 500 }}>
                              {val.referenceRange || 'Standard Norm'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <Badge variant={getFlagBadgeVariant(val.flag)}>
                                {val.flag || 'NORMAL'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Result Technical Notes */}
                    {res?.notes && (
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
                        <strong>Lab Notes:</strong> {res.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verifier Signature Block & Safety Rule Notice */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', paddingTop: '20px', borderTop: '2px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              PERFORMING SCIENTIST / TECHNICIAN
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Alex Mercer, MLS
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Medical Laboratory Scientist &bull; License #MLS-9821
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              INDEPENDENT VERIFIER SIGN-OFF
            </span>
            {report.verifiedBy ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#10b981' }}>
                  <ShieldCheck size={16} />
                  <span>{report.verifiedBy?.user?.fullName || report.verifiedBy?.fullName || 'Verified Medical Scientist'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Verified & Signed at {new Date(report.verifiedAt || report.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                Awaiting Peer Scientist Verification (Strict Separate Verifier Rule Enforced)
              </div>
            )}
          </div>
        </div>

        {/* Verification Comments Input Box (Only visible if not yet released) */}
        {report.status !== 'RELEASED' && (
          <div className="no-print" style={{ marginTop: '24px', padding: '16px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Verifier Verification Notes / Sign-off Comments
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Quality controls within 2SD, duplicate runs verified, findings cleared for clinical release..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default LabReportDetailPage;
