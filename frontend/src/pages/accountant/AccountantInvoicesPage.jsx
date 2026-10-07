import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Wallet,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantInvoicesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, totalAmount: 0, totalPaid: 0, totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Quick Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      };

      const res = await accountantApi.getInvoices(params);
      const data = res.data || res;
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 20 });

      // Compute local summary if present
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoices ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search, startDate, endDate, page]);

  const handleOpenPayment = (invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(invoice.outstandingAmount > 0 ? invoice.outstandingAmount.toString() : '');
    setPaymentMethod('CASH');
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentError(null);
    setPaymentSuccess(null);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError('Please specify a valid payment amount greater than ₹0');
      return;
    }

    if (amountNum > Number(paymentModalInvoice.outstandingAmount)) {
      setPaymentError(`Overpayment prohibited: Maximum allowed is ${formatCurrency(paymentModalInvoice.outstandingAmount)}`);
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);
    try {
      const res = await accountantApi.recordPayment(paymentModalInvoice.id, {
        amount: amountNum,
        paymentMethod,
        referenceNumber: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      setPaymentSuccess(res.data?.receiptNumber ? `Payment recorded! Receipt #${res.data.receiptNumber}` : 'Payment successfully settled!');
      setTimeout(() => {
        setPaymentModalInvoice(null);
        fetchInvoices();
      }, 1200);
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={28} color="#d97706" /> Invoices & Hospital Billing Registry
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Search, review, filter, and settle all inpatient & outpatient billing statements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/accountant/invoices/new')}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Create New Invoice
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Invoice #, Patient Name or Phone
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. INV-2026, Robert..."
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
              Payment Status
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
              <option value="PENDING">PENDING (Unpaid)</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID (Settled)</option>
              <option value="OVERDUE">OVERDUE (Past Due Date)</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
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

      {/* 3. Invoices Table */}
      {loading ? (
        <LoadingState message="Querying invoice ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInvoices} />
      ) : invoices.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Invoices Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No hospital invoices match the current search filters.
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
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE / DUE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TOTAL</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PAID</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>OUTSTANDING</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue = inv.isOverdue;
                  return (
                    <tr
                      key={inv.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}
                    >
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
                          {formatDate(inv.createdAt)}
                        </div>
                        {inv.dueDate && (
                          <div style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-muted, #94a3b8)' }}>
                            Due: {formatDate(inv.dueDate)}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                          {inv.patient?.fullName || 'Walk-in Patient'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {inv.patient?.patientIdNumber} {inv.patient?.phone ? `• ${inv.patient?.phone}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', fontWeight: '800', color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      <td style={{ padding: '14px 14px', color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      <td style={{ padding: '14px 14px', fontWeight: '800', fontSize: '0.92rem', color: Number(inv.outstandingAmount) > 0 ? '#ef4444' : '#94a3b8' }}>
                        {formatCurrency(inv.outstandingAmount)}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <Badge variant={getStatusBadgeVariant(inv.status)}>
                            {inv.status}
                          </Badge>
                          {isOverdue && (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <AlertTriangle size={10} /> OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outline"
                            size="xs"
                            title="View Detailed Invoice Statement"
                            onClick={() => navigate(`/app/accountant/invoices/${inv.id}`)}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} /> View
                          </Button>
                          {Number(inv.outstandingAmount) > 0 && inv.status !== 'CANCELLED' && (
                            <Button
                              variant="primary"
                              size="xs"
                              title="Record Payment"
                              onClick={() => handleOpenPayment(inv)}
                            >
                              <Wallet size={13} style={{ marginRight: '4px' }} /> Pay
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
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} invoices)
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

      {/* 4. Quick Record Payment Modal */}
      {paymentModalInvoice && (
        <Modal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          title={`Record Payment — ${paymentModalInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleRecordPaymentSubmit}>
            <div style={{ marginBottom: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Already Settled:</span>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{formatCurrency(paymentModalInvoice.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f87171' }}>Remaining Due:</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(paymentModalInvoice.outstandingAmount)}</span>
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={paymentModalInvoice.outstandingAmount}
                className="med-form-input"
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: '700' }}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Exact outstanding balance: {formatCurrency(paymentModalInvoice.outstandingAmount)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Payment Method *
                </label>
                <select
                  className="med-form-select"
                  style={{ width: '100%' }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="CARD">CARD (POS)</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="INSURANCE">INSURANCE / TPA</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Transaction / POS Reference #
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. TXN-984128, POS-Auth"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                Notes / Remarks
              </label>
              <textarea
                className="med-form-textarea"
                style={{ width: '100%', height: '60px' }}
                placeholder="Optional billing clerk notes..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setPaymentModalInvoice(null)} disabled={submittingPayment}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingPayment}>
                {submittingPayment ? 'Processing...' : 'Confirm Payment & Issue Receipt'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantInvoicesPage;
