import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  DollarSign,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientBillingPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalPaid: 0, outstandingBalance: 0, pendingCount: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchInvoices = async (status = 'ALL', page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getInvoices({
        status: status === 'ALL' ? undefined : status,
        page,
        limit: 10,
      });
      if (res.data) {
        setInvoices(res.data.invoices || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
      if (onShowToast) onShowToast('Failed to fetch billing statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(statusFilter, 1);
  }, []);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    fetchInvoices(status, 1);
  };

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
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Receipt size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Billing & Financial Statements
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Review itemized hospital invoices, pay outstanding balances, and track payment receipts.
          </p>
        </div>

        <Link
          to="/app/patient/payments"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            borderRadius: 10,
            backgroundColor: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            color: 'var(--text-primary, #1e293b)',
            fontWeight: 600,
            fontSize: '0.84rem',
            textDecoration: 'none',
          }}
        >
          <CreditCard size={16} color="#0284c7" />
          <span>Payment History & Receipts</span>
        </Link>
      </div>

      {/* ── Financial Summary Stat Cards ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 14,
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: summary.outstandingBalance > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(5, 150, 105, 0.1)',
            color: summary.outstandingBalance > 0 ? '#ef4444' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
              Outstanding Due
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: summary.outstandingBalance > 0 ? '#ef4444' : '#059669', marginTop: '0.1rem' }}>
              ${Number(summary.outstandingBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 14,
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
              Total Paid to Date
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '0.1rem' }}>
              ${Number(summary.totalPaid || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 14,
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
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
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
              Total Billed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '0.1rem' }}>
              ${Number(summary.totalBilled || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            Filter Invoices:
          </span>
          {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                style={{
                  background: isSelected ? '#d97706' : 'var(--pill-bg, #f1f5f9)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                  border: isSelected ? '1px solid #d97706' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 20,
                  padding: '0.25rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Invoices' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
          Showing <strong>{invoices.length}</strong> statement{invoices.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Invoices List ───────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 140,
              borderRadius: 14,
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : invoices.length === 0 ? (
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
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
          }}>
            <Receipt size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Invoices Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {statusFilter !== 'ALL'
              ? `You do not have any ${statusFilter.toLowerCase()} invoices. Try selecting 'All Invoices'.`
              : 'You do not have any billing statements on record. Hospital invoices generated for appointments, tests, and medicines will be listed here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {invoices.map((inv) => {
            const dateFormatted = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Recent Invoice';

            const isPaid = inv.status === 'PAID';
            const isUnpaid = inv.status === 'UNPAID';
            const isPartial = inv.status === 'PARTIAL';

            return (
              <div
                key={inv.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Left: Invoice Number, Date, Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: isPaid ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    color: isPaid ? '#059669' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Receipt size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary, #0f172a)' }}>
                        {inv.invoiceNumber || `INV-${inv.id?.substring(0, 8).toUpperCase()}`}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 20,
                        backgroundColor: isPaid ? 'rgba(5, 150, 105, 0.15)' : isPartial ? 'rgba(217, 119, 6, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPaid ? '#059669' : isPartial ? '#d97706' : '#ef4444',
                        textTransform: 'uppercase',
                      }}>
                        {inv.status || 'UNPAID'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.2rem' }}>
                      Issued: {dateFormatted} {inv.dueDate && ` &bull; Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                {/* Right: Amounts & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                      {isPaid ? 'Total Paid' : 'Balance Due'}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isPaid ? '#059669' : '#ef4444' }}>
                      ${Number(isPaid ? inv.totalAmount : inv.balanceAmount || inv.totalAmount).toFixed(2)}
                    </div>
                    {!isPaid && inv.paidAmount > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#059669' }}>
                        (${Number(inv.paidAmount).toFixed(2)} paid)
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/app/patient/billing/${inv.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 1.1rem',
                      borderRadius: 8,
                      backgroundColor: isPaid ? 'rgba(2, 132, 199, 0.08)' : '#0284c7',
                      color: isPaid ? '#0284c7' : '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      textDecoration: 'none',
                      border: isPaid ? '1px solid rgba(2, 132, 199, 0.25)' : 'none',
                    }}
                  >
                    <span>{isPaid ? 'View Statement' : 'Pay / View Invoice'}</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchInvoices(statusFilter, pagination.page - 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #fff)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: pagination.page <= 1 ? 0.5 : 1,
              fontSize: '0.82rem',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchInvoices(statusFilter, pagination.page + 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #fff)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              opacity: pagination.page >= pagination.pages ? 0.5 : 1,
              fontSize: '0.82rem',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientBillingPage;
