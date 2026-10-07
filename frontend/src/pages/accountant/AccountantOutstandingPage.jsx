import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Wallet,
  Receipt,
  Eye,
  RefreshCw,
  Phone,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantOutstandingPage = () => {
  const navigate = useNavigate();

  const [agingData, setAgingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [activeBucket, setActiveBucket] = useState('ALL'); // 'ALL' | 'CURRENT' | 'THIRTY' | 'SIXTY' | 'NINETY'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Quick Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const fetchOutstanding = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        bucket: activeBucket !== 'ALL' ? activeBucket : undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const res = await accountantApi.getOutstandingAging(params);
      const data = res.data || res;
      setAgingData(data);
    } catch (err) {
      setError(err.message || 'Failed to load outstanding balances aging');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOutstanding();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeBucket, search, page]);

  const handleOpenPayment = (inv) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(inv.outstandingAmount > 0 ? inv.outstandingAmount.toString() : '');
    setPaymentMethod('CASH');
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentError(null);
    setPaymentSuccess(null);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError('Please enter a valid amount.');
      return;
    }
    if (amountNum > Number(paymentModalInvoice.outstandingAmount)) {
      setPaymentError(`Overpayment prohibited: Max allowable is ${formatCurrency(paymentModalInvoice.outstandingAmount)}`);
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);
    try {
      await accountantApi.recordPayment(paymentModalInvoice.id, {
        amount: amountNum,
        paymentMethod,
        referenceNumber: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      setPaymentSuccess('Payment recorded and accounts receivable updated!');
      setTimeout(() => {
        setPaymentModalInvoice(null);
        fetchOutstanding();
      }, 1000);
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const buckets = agingData?.agingSummary || { current: 0, thirtyToSixty: 0, sixtyToNinety: 0, overNinety: 0, totalOutstanding: 0 };
  const invoices = agingData?.invoices || [];
  const pagination = agingData?.pagination || { total: 0, totalPages: 1, limit: 20 };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={28} color="#ef4444" /> Accounts Receivable & Aging Buckets
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Track open hospital receivables, maturity intervals, overdue bills, and patient collections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchOutstanding}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/accountant/invoices/new')}>
            New Invoice
          </Button>
        </div>
      </div>

      {/* 2. Aging Bucket Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total Outstanding */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: activeBucket === 'ALL' ? '2px solid #00d2b4' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => { setActiveBucket('ALL'); setPage(1); }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>ALL OUTSTANDING</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
            {formatCurrency(buckets.totalOutstanding)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Total Hospital Dues</div>
        </div>

        {/* 0-30 Days */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: activeBucket === 'CURRENT' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => { setActiveBucket('CURRENT'); setPage(1); }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>0 – 30 DAYS (CURRENT)</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
            {formatCurrency(buckets.current)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Normal payment terms</div>
        </div>

        {/* 31-60 Days */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: activeBucket === 'THIRTY' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => { setActiveBucket('THIRTY'); setPage(1); }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b' }}>31 – 60 DAYS</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
            {formatCurrency(buckets.thirtyToSixty)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Follow-up required</div>
        </div>

        {/* 61-90 Days */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: activeBucket === 'SIXTY' ? '2px solid #fb923c' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => { setActiveBucket('SIXTY'); setPage(1); }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fb923c' }}>61 – 90 DAYS</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
            {formatCurrency(buckets.sixtyToNinety)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Urgent notice</div>
        </div>

        {/* 90+ Days */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: activeBucket === 'NINETY' ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => { setActiveBucket('NINETY'); setPage(1); }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ef4444' }}>90+ DAYS (OVERDUE)</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            {formatCurrency(buckets.overNinety)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '2px' }}>High risk arrears</div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="med-form-input"
            style={{ width: '100%', paddingLeft: '36px' }}
            placeholder="Search overdue invoice by Invoice #, patient name, or phone number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {/* 4. Outstanding Invoices Table */}
      {loading ? (
        <LoadingState message="Segmenting accounts receivable aging ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOutstanding} />
      ) : invoices.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Outstanding Invoices in this Bucket
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              All invoices in this aging segment have been settled in full.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>INVOICE #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AGE / DUE DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT / PHONE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TOTAL BILLED</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>SETTLED</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>BALANCE DUE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AGING BUCKET</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue = inv.isOverdue;
                  const daysOld = Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 14px', fontWeight: '700', color: '#d97706', fontSize: '0.92rem' }}>
                        <span
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => navigate(`/app/accountant/invoices/${inv.id}`)}
                        >
                          {inv.invoiceNumber}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600' }}>
                          {daysOld} days old
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : '#94a3b8' }}>
                          Due: {formatDate(inv.dueDate)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                          {inv.patient?.fullName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {inv.patient?.phone || 'No phone recorded'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      <td style={{ padding: '14px 14px', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      <td style={{ padding: '14px 14px', fontWeight: '800', color: '#ef4444', fontSize: '0.95rem' }}>
                        {formatCurrency(inv.outstandingAmount)}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            background:
                              daysOld > 90
                                ? 'rgba(239, 68, 68, 0.15)'
                                : daysOld > 60
                                ? 'rgba(251, 146, 60, 0.15)'
                                : daysOld > 30
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                            color:
                              daysOld > 90
                                ? '#f87171'
                                : daysOld > 60
                                ? '#fb923c'
                                : daysOld > 30
                                ? '#f59e0b'
                                : '#34d399',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          {daysOld > 90 ? '90+ Days' : daysOld > 60 ? '61-90 Days' : daysOld > 30 ? '31-60 Days' : '0-30 Days'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate(`/app/accountant/invoices/${inv.id}`)}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} /> View
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenPayment(inv)}
                          >
                            <Wallet size={13} style={{ marginRight: '4px' }} /> Collect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} records)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5. Settle Payment Modal */}
      {paymentModalInvoice && (
        <Modal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          title={`Collect Outstanding Balance — ${paymentModalInvoice.invoiceNumber}`}
        >
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Patient:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                  {paymentModalInvoice.patient?.fullName} ({paymentModalInvoice.patient?.patientIdNumber})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Invoiced:</span>
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{formatCurrency(paymentModalInvoice.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f87171' }}>Remaining Due:</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(paymentModalInvoice.outstandingAmount)}</span>
              </div>
            </div>

            {paymentError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {paymentSuccess}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Amount to Pay (₹) *</label>
              <input type="number" step="0.01" min="0.01" max={paymentModalInvoice.outstandingAmount} className="med-form-input" style={{ width: '100%', fontSize: '1.1rem', fontWeight: '700' }} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Payment Method *</label>
                <select className="med-form-select" style={{ width: '100%' }} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD (POS)</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="INSURANCE">INSURANCE / TPA</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Reference #</label>
                <input type="text" className="med-form-input" style={{ width: '100%' }} placeholder="e.g. TXN-19482" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Notes</label>
              <textarea className="med-form-textarea" style={{ width: '100%', height: '60px' }} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setPaymentModalInvoice(null)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingPayment}>{submittingPayment ? 'Saving...' : 'Confirm Payment'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantOutstandingPage;
