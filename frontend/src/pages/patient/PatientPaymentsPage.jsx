import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  DollarSign,
  ChevronRight,
  Clock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientPaymentsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getPayments({ page, limit: 10 });
      if (res.data) {
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load payments', err);
      if (onShowToast) onShowToast('Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const totalPaidSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

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
            <Link
              to="/app/patient/billing"
              style={{
                color: 'var(--text-secondary, #64748b)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                marginRight: '0.25rem',
              }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <CreditCard size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Payment Receipts & History
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Complete ledger of confirmed payments, transaction references, and printable hospital receipts.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          border: '1px solid rgba(5, 150, 105, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: '#059669',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>Verified Payment Ledger</span>
        </div>
      </div>

      {/* ── Payments Table ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 120,
              borderRadius: 14,
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: 16,
          padding: '3.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
          }}>
            <CreditCard size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Payment Transactions Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            You have not made any payments through the patient portal yet. Receipts generated for invoice payments will be stored here.
          </p>
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
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Receipt / Ref #</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Invoice Linked</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Channel / Method</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Date & Time</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Amount</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const dateFormatted = p.paidAt ? new Date(p.paidAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : 'Recorded';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {p.paymentNumber || `REC-${p.id?.substring(0, 8).toUpperCase()}`}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {p.invoiceId ? (
                          <Link
                            to={`/app/patient/billing/${p.invoiceId}`}
                            style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                          >
                            {p.invoiceNumber || `Invoice #${p.invoiceId.substring(0, 8)}`}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-secondary, #64748b)' }}>Hospital Service</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary, #334155)' }}>
                        <span style={{
                          backgroundColor: 'var(--pill-bg, #f1f5f9)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}>
                          {p.method || 'Online Card'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary, #64748b)' }}>
                        {dateFormatted}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                        ${Number(p.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid var(--border-color, #cbd5e1)',
                            backgroundColor: 'var(--card-bg, #ffffff)',
                            color: 'var(--text-primary, #334155)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Receipt Viewer Modal ──────────────────────────────────────── */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 440,
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <Receipt size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Hospital Payment Receipt
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
                Ref #{selectedReceipt.paymentNumber || selectedReceipt.id}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.86rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                <span>Amount Paid</span>
                <strong style={{ color: '#059669', fontSize: '1.1rem' }}>${Number(selectedReceipt.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                <span>Payment Channel</span>
                <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>{selectedReceipt.method || 'Online'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                <span>Transaction Date</span>
                <span style={{ color: 'var(--text-primary, #0f172a)' }}>
                  {selectedReceipt.paidAt ? new Date(selectedReceipt.paidAt).toLocaleString() : 'Confirmed'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                <span>Status</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>VERIFIED / COMPLETED</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  color: 'var(--text-primary, #334155)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 8,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPaymentsPage;
