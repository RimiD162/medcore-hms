import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  DollarSign,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, StatCard, Badge, Button, Modal, ConfirmationDialog, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistPaymentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onShowToast } = useOutletContext() || {};

  const preselectedInvoiceId = searchParams.get('invoiceId');

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Record Payment Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Confirmation Dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        paymentMethod: paymentMethod || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const [payRes, invRes] = await Promise.all([
        receptionistApi.getPayments(params),
        receptionistApi.getInvoices({ status: 'PENDING,PARTIALLY_PAID', limit: 50 }),
      ]);

      const payData = payRes.data || payRes;
      const invData = invRes.data || invRes;

      setPayments(payData.payments || []);
      setPagination(payData.pagination || { total: 0, totalPages: 1, limit: 20 });
      setInvoices(invData.invoices || []);

      if (preselectedInvoiceId && !selectedInvoiceId) {
        setSelectedInvoiceId(preselectedInvoiceId);
        setRecordModalOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payments ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [paymentMethod, search, page]);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const outstandingAmount = selectedInvoice ? Number(selectedInvoice.outstandingAmount) : 0;

  // Set default full payment amount when invoice selected
  useEffect(() => {
    if (selectedInvoice && (!amount || Number(amount) > outstandingAmount)) {
      setAmount(String(outstandingAmount));
    }
  }, [selectedInvoiceId]);

  const handleOpenConfirmDialog = (e) => {
    e.preventDefault();
    setPaymentError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError('Payment amount must be greater than $0.00');
      return;
    }

    if (numAmount > outstandingAmount) {
      setPaymentError(`Payment amount ($${numAmount.toFixed(2)}) cannot exceed outstanding balance ($${outstandingAmount.toFixed(2)}).`);
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleExecutePayment = async () => {
    setSubmitting(true);
    setPaymentError(null);

    try {
      const payload = {
        invoiceId: selectedInvoiceId,
        patientId: selectedInvoice.patientId,
        amount: parseFloat(amount),
        paymentMethod: method,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      };

      const res = await receptionistApi.recordPayment(payload);
      const data = res.data || res;

      if (onShowToast) {
        onShowToast(`Payment of $${parseFloat(amount).toFixed(2)} recorded! Receipt: ${data.payment?.receiptNumber}`);
      }

      setConfirmDialogOpen(false);
      setRecordModalOpen(false);
      setSelectedInvoiceId('');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      fetchPayments();
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment transaction.');
      setConfirmDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={28} color="#00d2b4" /> Payment Registry & Settlement
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Record cash, card, UPI and insurance settlements with strict overpayment protection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setRecordModalOpen(true)}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Record Payment
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Receipt #, Reference or Patient
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Search..."
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
              <option value="">All Payment Methods</option>
              <option value="CASH">CASH</option>
              <option value="CARD">CREDIT / DEBIT CARD</option>
              <option value="UPI">UPI / QR CODE</option>
              <option value="NET_BANKING">NET BANKING</option>
              <option value="CHEQUE">CHEQUE / DD</option>
              <option value="INSURANCE">INSURANCE TPA</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Payments Ledger Table */}
      {loading ? (
        <LoadingState message="Loading payment transactions ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPayments} />
      ) : payments.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Wallet size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Payment Transactions Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              No payment receipts recorded for the selected search filters.
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
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT NAME</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>INVOICE #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>METHOD</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>REF / NOTE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 14px', fontWeight: '700', color: '#10b981', fontSize: '0.9rem' }}>
                      {pay.receiptNumber}
                    </td>

                    <td style={{ padding: '14px 14px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem' }}>
                      {new Date(pay.paymentDate).toLocaleString()}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <div
                        style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/app/receptionist/patients/${pay.patientId}`)}
                      >
                        {pay.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {pay.patient?.patientIdNumber}
                      </div>
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '700', color: '#00d2b4', fontSize: '0.85rem' }}>
                      {pay.invoice?.invoiceNumber}
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '800', color: '#10b981', fontSize: '1rem' }}>
                      ${Number(pay.amount).toFixed(2)}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <Badge variant="blue">{pay.paymentMethod}</Badge>
                    </td>

                    <td style={{ padding: '14px 14px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem' }}>
                      {pay.referenceNumber || pay.notes || '—'}
                    </td>

                    <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate(`/app/receptionist/invoices?invoiceId=${pay.invoiceId}`)}
                      >
                        <Receipt size={13} style={{ marginRight: '4px' }} /> View Bill
                      </Button>
                    </td>
                  </tr>
                ))}
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
                Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} receipts)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Record Payment Modal */}
      {recordModalOpen && (
        <Modal
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          title="Record Patient Payment Settlement"
        >
          <form onSubmit={handleOpenConfirmDialog} style={{ padding: '8px 0' }}>
            {paymentError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{paymentError}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="med-form-label">Select Outstanding Invoice *</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                required
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                <option value="">-- Choose Unpaid Invoice --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} &bull; {inv.patient?.fullName} — Outstanding: ${Number(inv.outstandingAmount).toFixed(2)} (Total: ${Number(inv.totalAmount).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Patient:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedInvoice.patient?.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Total Billed:</span>
                  <span>${Number(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#34d399' }}>Already Paid:</span>
                  <span>${Number(selectedInvoice.paidAmount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px', fontWeight: '700' }}>
                  <span style={{ color: '#f87171' }}>Max Payable Balance:</span>
                  <span style={{ color: '#ef4444' }}>${outstandingAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="med-form-label">Payment Amount ($) *</label>
                <input
                  type="number"
                  className="med-form-input"
                  style={{ width: '100%', fontWeight: '700', fontSize: '1rem' }}
                  required
                  min="0.01"
                  max={outstandingAmount || 999999}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="med-form-label">Payment Method *</label>
                <select
                  className="med-form-select"
                  style={{ width: '100%' }}
                  required
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="CARD">CREDIT / DEBIT CARD</option>
                  <option value="UPI">UPI / QR CODE</option>
                  <option value="NET_BANKING">NET BANKING</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="INSURANCE">INSURANCE TPA</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="med-form-label">Reference / Txn Number</label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. UPI-99201948 or Card Last 4"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="med-form-label">Cashier Remarks / Notes</label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Front desk settlement"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedInvoiceId || !amount || Number(amount) <= 0}
              >
                Review & Confirm &rarr;
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mandatory Final ConfirmDialog */}
      {confirmDialogOpen && selectedInvoice && (
        <ConfirmationDialog
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={handleExecutePayment}
          title="Confirm Payment Collection"
          message={`Are you sure you want to collect $${parseFloat(amount).toFixed(2)} via ${method} for ${selectedInvoice.patient?.fullName} on Invoice ${selectedInvoice.invoiceNumber}? This action is irreversible and recorded in the hospital audit trail.`}
          confirmLabel={submitting ? 'Recording Settlement...' : 'Yes, Confirm & Record'}
          cancelLabel="Cancel"
          variant="primary"
        />
      )}
    </div>
  );
};

export default ReceptionistPaymentsPage;
