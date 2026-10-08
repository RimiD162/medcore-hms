import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  DollarSign,
  ChevronRight,
  Clock,
  ArrowRight,
  Building,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientInsurancePage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ policies: [], claims: [] });

  useEffect(() => {
    async function fetchInsurance() {
      try {
        setLoading(true);
        const res = await patientApi.getInsurance();
        if (res.data) {
          setData({
            policies: res.data.policies || [],
            claims: res.data.claims || [],
          });
        }
      } catch (err) {
        console.error('Failed to load insurance', err);
        if (onShowToast) onShowToast('Failed to fetch insurance coverage');
      } finally {
        setLoading(false);
      }
    }

    fetchInsurance();
  }, []);

  const policies = data.policies || [];
  const claims = data.claims || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <ShieldCheck size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Insurance Coverage & TPA Claims
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Review registered health insurance policies, coverage limits, copay terms, and real-time claim adjudication status.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: '#0284c7',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>TPA Hospital Desk Linked</span>
        </div>
      </div>

      {/* ── Active Insurance Policies ────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-primary, #0f172a)' }}>
          Active Health Insurance Policies ({policies.length})
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ height: 200, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px dashed var(--border-color, #cbd5e1)',
            borderRadius: 16,
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <ShieldCheck size={36} color="#94a3b8" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              No Active Insurance Policy On File
            </h3>
            <p style={{ margin: 0, maxWidth: 440, fontSize: '0.86rem', color: 'var(--text-secondary, #64748b)' }}>
              If you have healthcare insurance coverage, please submit your insurance card to the hospital reception or upload it to your Document Vault.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {policies.map((pol) => {
              const coverage = pol.coverageDetails || {};
              const validUntil = pol.validTo ? new Date(pol.validTo).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }) : 'Ongoing';

              return (
                <div
                  key={pol.id}
                  style={{
                    background: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: 16,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Building size={22} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                            {pol.providerName}
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
                            Policy #{pol.policyNumber}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 20,
                        backgroundColor: 'rgba(5, 150, 105, 0.15)',
                        color: '#059669',
                        textTransform: 'uppercase',
                      }}>
                        {pol.status || 'ACTIVE'}
                      </span>
                    </div>

                    {/* Policy metadata */}
                    <div style={{
                      backgroundColor: 'var(--subcard-bg, #f8fafc)',
                      borderRadius: 10,
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-color, #f1f5f9)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      fontSize: '0.82rem',
                      marginBottom: '1rem',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.74rem' }}>Policy Holder</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{pol.policyHolderName || 'Self'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.74rem' }}>Group / Plan #</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{pol.groupNumber || 'Standard'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.74rem' }}>Valid Until</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{validUntil}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.74rem' }}>Patient Copay</span>
                        <div style={{ fontWeight: 700, color: '#0284c7' }}>{coverage.copayPercentage || 10}%</div>
                      </div>
                    </div>

                    {/* Coverage limits */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                        <span>IPD Inpatient Max Limit:</span>
                        <strong style={{ color: 'var(--text-primary, #0f172a)' }}>${Number(coverage.ipdLimit || 50000).toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                        <span>OPD Outpatient Annual Limit:</span>
                        <strong style={{ color: 'var(--text-primary, #0f172a)' }}>${Number(coverage.opdLimit || 2500).toLocaleString()}</strong>
                      </div>
                      {coverage.remainingAllowance && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                          <span>Remaining Allowance:</span>
                          <strong>${Number(coverage.remainingAllowance).toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Insurance Claims Table ───────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-primary, #0f172a)' }}>
          Insurance Claims History ({claims.length})
        </h2>

        {loading ? (
          <div style={{ height: 160, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'pulse 1.5s infinite' }} />
        ) : claims.length === 0 ? (
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px dashed var(--border-color, #cbd5e1)',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            textAlign: 'center',
            color: 'var(--text-secondary, #64748b)',
            fontSize: '0.88rem',
          }}>
            No insurance claims submitted yet for your healthcare services.
          </div>
        ) : (
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--subcard-bg, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Claim Number</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Insurer / Provider</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Claimed Amount</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Approved Amount</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Submission Date</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textAlign: 'right' }}>Claim Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const isApproved = claim.status === 'APPROVED' || claim.status === 'SETTLED';
                    const isRejected = claim.status === 'REJECTED';
                    const isPending = claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW';

                    return (
                      <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                            {claim.claimNumber || `CLM-${claim.id?.substring(0, 8).toUpperCase()}`}
                          </div>
                          {claim.invoiceId && (
                            <Link to={`/app/patient/billing/${claim.invoiceId}`} style={{ fontSize: '0.75rem', color: '#0284c7', textDecoration: 'none' }}>
                              View Linked Invoice
                            </Link>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary, #334155)', fontWeight: 600 }}>
                          {claim.providerName || 'Insurance Provider'}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary, #0f172a)', fontWeight: 700 }}>
                          ${Number(claim.claimedAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: isApproved ? '#059669' : 'var(--text-secondary, #64748b)', fontWeight: 700 }}>
                          {claim.approvedAmount ? `$${Number(claim.approvedAmount).toFixed(2)}` : 'Pending Review'}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary, #64748b)' }}>
                          {claim.submissionDate ? new Date(claim.submissionDate).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 20,
                            backgroundColor: isApproved ? 'rgba(5, 150, 105, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                            color: isApproved ? '#059669' : isRejected ? '#ef4444' : '#d97706',
                            textTransform: 'uppercase',
                          }}>
                            {claim.status || 'SUBMITTED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Advisory Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '1rem 1.25rem',
        borderRadius: 12,
        backgroundColor: 'rgba(2, 132, 199, 0.04)',
        border: '1px solid rgba(2, 132, 199, 0.15)',
        fontSize: '0.82rem',
        color: 'var(--text-secondary, #64748b)',
      }}>
        <Info size={18} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>
          <strong>TPA Desk Notice:</strong> Insurance claims are processed through the Hospital Revenue & Billing Office. For cashless pre-authorization or claim query adjustments, visit the TPA Helpdesk at Main Wing counter 4.
        </span>
      </div>
    </div>
  );
};

export default PatientInsurancePage;
