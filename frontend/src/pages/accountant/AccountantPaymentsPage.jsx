import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Search,
  Filter,
  Plus,
  Printer,
  Ban,
  RefreshCw,
  Receipt,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantPaymentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('receipt') || searchParams.get('search') || '');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Void Modal State
  const [voidPaymentObj, setVoidPaymentObj] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [submittingVoid, setSubmittingVoid] = useState(false);
  const [voidError, setVoidError] = useState(null);

  // Receipt Voucher Print Preview Modal
  const [receiptVoucher, setReceiptVoucher] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: search || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      };

      const res = await accountantApi.getPayments(params);
      const data = res.data || res;
      setPayments(data.payments || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 20 });
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, paymentMethod, status, startDate, endDate, page]);

  // Handle Void Submit
  const handleVoidSubmit = async (e) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setVoidError('A mandatory reason is required to void a payment.');
      return;
    }

    setSubmittingVoid(true);
    setVoidError(null);
    try {
      await accountantApi.voidPayment(voidPaymentObj.id, {
        reason: voidReason.trim(),
      });
      setVoidPaymentObj(null);
      setVoidReason('');
      fetchPayments();
    } catch (err) {
      setVoidError(err.message || 'Failed to void payment');
    } finally {
      setSubmittingVoid(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={28} color="#10b981" /> Payment Collections & Receipts
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time receipt registers, POS settlements, insurance remittances, and payment audits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/accountant/invoices')}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Settle From Invoice
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Receipt #, Invoice, Patient
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. REC-2026, Eleanor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Payment Method
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Methods</option>
              <option value="CASH">CASH</option>
              <option value="CARD">CARD (POS)</option>
              <option value="UPI">UPI / QR</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="INSURANCE">INSURANCE / TPA</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Status
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="VOIDED">VOIDED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              From Date
            </label>
            <input
              type="date"
              className="med-form-input"
              style={{ width: '100%' }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              To Date
            </label>
            <input
              type="date"
              className="med-form-input"
              style={{ width: '100%' }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* 3. Payments Registry Table */}
      {loading ? (
        <LoadingState message="Loading payment registry..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPayments} />
      ) : payments.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Wallet size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Payments Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No payment transactions match the specified search criteria.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>RECEIPT #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE & TIME</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>INVOICE #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>METHOD</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>REFERENCE #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>COLLECTED BY</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isVoided = p.status === 'VOIDED';
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        opacity: isVoided ? 0.6 : 1,
                      }}
                    >
                      <td style={{ padding: '14px 14px', fontWeight: '700', color: '#10b981', fontSize: '0.92rem' }}>
                        {p.receiptNumber}
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {formatDate(p.createdAt, true)}
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.88rem' }}>
                        <span
                          style={{ color: '#d97706', cursor: 'pointer', fontWeight: '600' }}
                          onClick={() => navigate(`/app/accountant/invoices/${p.invoiceId}`)}
                        >
                          {p.invoice?.invoiceNumber || '—'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.9rem' }}>
                          {p.patient?.fullName || p.invoice?.patient?.fullName || 'Walk-in'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {p.patient?.patientIdNumber || p.invoice?.patient?.patientIdNumber}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                          }}
                        >
                          {p.paymentMethod}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {p.referenceNumber || '—'}
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.82rem', color: 'var(--text-main, #f8fafc)' }}>
                        {p.receivedBy?.fullName || 'Finance Staff'}
                      </td>

                      <td
                        style={{
                          padding: '14px 14px',
                          fontWeight: '800',
                          color: isVoided ? '#94a3b8' : '#10b981',
                          fontSize: '0.95rem',
                          textDecoration: isVoided ? 'line-through' : 'none',
                        }}
                      >
                        +{formatCurrency(p.amount)}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <Badge variant={p.status === 'COMPLETED' ? 'teal' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>

                      <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outline"
                            size="xs"
                            title="Print Voucher Receipt"
                            onClick={() => setReceiptVoucher(p)}
                          >
                            <Printer size={13} style={{ marginRight: '4px' }} /> Voucher
                          </Button>
                          {!isVoided && (
                            <Button
                              variant="outline"
                              size="xs"
                              title="Void Receipt"
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => {
                                setVoidPaymentObj(p);
                                setVoidReason('');
                                setVoidError(null);
                              }}
                            >
                              <Ban size={13} style={{ marginRight: '4px' }} /> Void
                            </Button>
                          )}
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
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} receipts)
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

      {/* 4. Void Payment Modal */}
      {voidPaymentObj && (
        <Modal
          isOpen={!!voidPaymentObj}
          onClose={() => setVoidPaymentObj(null)}
          title={`Void Payment Receipt — ${voidPaymentObj.receiptNumber}`}
        >
          <form onSubmit={handleVoidSubmit}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', marginBottom: '6px' }}>
                <AlertTriangle size={18} /> Critical Financial Action
              </div>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
                Voiding this receipt for <strong>{formatCurrency(voidPaymentObj.amount)}</strong> will recalculate invoice <strong>{voidPaymentObj.invoice?.invoiceNumber}</strong>'s outstanding balance, reinstating the debt in accounts receivable.
              </p>
            </div>

            {voidError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {voidError}
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Mandatory Void Reason *
              </label>
              <textarea
                className="med-form-textarea"
                style={{ width: '100%', height: '80px' }}
                placeholder="Explain reason for voiding (e.g. Duplicate entry, bounced cheque, accidental clerk mistake)..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setVoidPaymentObj(null)} disabled={submittingVoid}>
                Back
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingVoid} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                {submittingVoid ? 'Voiding...' : 'Confirm & Void Receipt'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Print Receipt Voucher Modal */}
      {receiptVoucher && (
        <Modal
          isOpen={!!receiptVoucher}
          onClose={() => setReceiptVoucher(null)}
          title={`Hospital Receipt Voucher — ${receiptVoucher.receiptNumber}`}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255, 255, 255, 0.15)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#00d2b4', margin: 0 }}>MedCore Hospital & Medical Center</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Official Cash & Financial Settlement Voucher
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem', marginBottom: '16px' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Receipt Number:</span>
                <div style={{ fontWeight: '700', color: '#10b981' }}>{receiptVoucher.receiptNumber}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Date:</span>
                <div style={{ fontWeight: '600', color: '#f8fafc' }}>{formatDate(receiptVoucher.createdAt, true)}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Invoice Number:</span>
                <div style={{ fontWeight: '600', color: '#d97706' }}>{receiptVoucher.invoice?.invoiceNumber || '—'}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Payment Method:</span>
                <div style={{ fontWeight: '600', color: '#f8fafc' }}>{receiptVoucher.paymentMethod}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Patient:</span>
                <div style={{ fontWeight: '600', color: '#f8fafc' }}>{receiptVoucher.patient?.fullName || receiptVoucher.invoice?.patient?.fullName || 'Walk-in'}</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Received By:</span>
                <div style={{ fontWeight: '600', color: '#f8fafc' }}>{receiptVoucher.receivedBy?.fullName || 'Finance Staff'}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: '600', textTransform: 'uppercase' }}>Amount Received</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {formatCurrency(receiptVoucher.amount)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={14} style={{ marginRight: '6px' }} /> Print
              </Button>
              <Button variant="primary" size="sm" onClick={() => setReceiptVoucher(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountantPaymentsPage;
