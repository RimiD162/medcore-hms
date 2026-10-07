import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Wallet,
  RotateCcw,
  Sliders,
  XCircle,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantInvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Adjustment form state
  const [adjType, setAdjType] = useState('CREDIT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  // Refund form state
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Cancel form state
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountantApi.getInvoiceById(id);
      const data = res.data || res;
      setInvoice(data);
      if (data.outstandingAmount > 0) {
        setPaymentAmount(data.outstandingAmount.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // Handle Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setActionError('Please enter a valid amount.');
      return;
    }
    if (amountNum > Number(invoice.outstandingAmount)) {
      setActionError(`Overpayment prohibited: Maximum allowable is ${formatCurrency(invoice.outstandingAmount)}`);
      return;
    }

    setSubmittingPayment(true);
    setActionError(null);
    try {
      await accountantApi.recordPayment(invoice.id, {
        amount: amountNum,
        paymentMethod,
        referenceNumber: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });
      setActionSuccess('Payment recorded successfully!');
      setTimeout(() => {
        setShowPaymentModal(false);
        setActionSuccess(null);
        fetchInvoice();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Adjustment Submit
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(adjAmount);
    if (!amountNum || amountNum <= 0) {
      setActionError('Please enter a valid adjustment amount.');
      return;
    }
    if (!adjReason.trim()) {
      setActionError('A valid adjustment reason is mandatory.');
      return;
    }

    setSubmittingAdj(true);
    setActionError(null);
    try {
      await accountantApi.createAdjustment(invoice.id, {
        type: adjType,
        amount: amountNum,
        reason: adjReason.trim(),
      });
      setActionSuccess('Adjustment applied successfully!');
      setTimeout(() => {
        setShowAdjustmentModal(false);
        setActionSuccess(null);
        fetchInvoice();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Failed to apply adjustment');
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Handle Refund Submit
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(refundAmount);
    if (!amountNum || amountNum <= 0) {
      setActionError('Please enter a valid refund amount.');
      return;
    }
    if (!refundReason.trim()) {
      setActionError('Refund reason is required.');
      return;
    }

    setSubmittingRefund(true);
    setActionError(null);
    try {
      await accountantApi.requestRefund(invoice.id, {
        amount: amountNum,
        reason: refundReason.trim(),
      });
      setActionSuccess('Refund requested and queued for review!');
      setTimeout(() => {
        setShowRefundModal(false);
        setActionSuccess(null);
        fetchInvoice();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Failed to request refund');
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Handle Cancel Submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setActionError('Cancellation reason is mandatory.');
      return;
    }

    setSubmittingCancel(true);
    setActionError(null);
    try {
      await accountantApi.cancelInvoice(invoice.id, {
        reason: cancelReason.trim(),
      });
      setActionSuccess('Invoice successfully cancelled.');
      setTimeout(() => {
        setShowCancelModal(false);
        setActionSuccess(null);
        fetchInvoice();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel invoice');
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading invoice statement..." />;
  }

  if (error || !invoice) {
    return <ErrorState message={error || 'Invoice not found'} onRetry={fetchInvoice} />;
  }

  const isOverdue = invoice.isOverdue;
  const hasSurplus = Number(invoice.paidAmount) > Number(invoice.totalAmount);
  const surplusAmount = hasSurplus ? Number(invoice.paidAmount) - Number(invoice.totalAmount) : 0;

  return (
    <div className="med-page-container">
      {/* 1. Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/accountant/invoices')}>
            <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Invoices Registry
          </Button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
            Statement {invoice.invoiceNumber}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={14} style={{ marginRight: '6px' }} /> Print Statement
          </Button>

          {Number(invoice.outstandingAmount) > 0 && invoice.status !== 'CANCELLED' && (
            <Button variant="primary" size="sm" onClick={() => { setActionError(null); setShowPaymentModal(true); }}>
              <Wallet size={14} style={{ marginRight: '6px' }} /> Settle Payment
            </Button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <Button variant="outline" size="sm" onClick={() => { setActionError(null); setShowAdjustmentModal(true); }}>
              <Sliders size={14} style={{ marginRight: '6px' }} /> Billing Adjustment
            </Button>
          )}

          {hasSurplus && (
            <Button variant="outline" size="sm" onClick={() => { setActionError(null); setRefundAmount(surplusAmount.toString()); setShowRefundModal(true); }}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> Issue Refund
            </Button>
          )}

          {invoice.status !== 'CANCELLED' && Number(invoice.paidAmount) === 0 && (
            <Button variant="outline" size="sm" onClick={() => { setActionError(null); setShowCancelModal(true); }} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <XCircle size={14} style={{ marginRight: '6px' }} /> Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Invoice Statement Box */}
      <Card style={{ marginBottom: '24px' }}>
        {/* Statement Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d97706' }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
              Issue Date: <strong>{formatDate(invoice.createdAt)}</strong> &bull; Due Date: <strong>{formatDate(invoice.dueDate)}</strong>
            </div>
            {invoice.notes && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #f8fafc)', marginTop: '6px', fontStyle: 'italic' }}>
                Note: {invoice.notes}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                {invoice.status}
              </Badge>
              {isOverdue && (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                  }}
                >
                  OVERDUE
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '8px' }}>
              {formatCurrency(invoice.totalAmount)}
            </div>
          </div>
        </div>

        {/* Patient Demographic Summary Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '16px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>PATIENT NAME</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#00d2b4', marginTop: '2px' }}>
              {invoice.patient?.fullName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>PATIENT ID NUMBER</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
              {invoice.patient?.patientIdNumber}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>PHONE CONTACT</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
              {invoice.patient?.phone || '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>DEMOGRAPHICS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
              {invoice.patient?.gender} &bull; {invoice.patient?.age}y {invoice.patient?.bloodGroup ? `• ${invoice.patient.bloodGroup}` : ''}
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Itemized Hospital Services & Procedures
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: '#94a3b8' }}>SERVICE / DESCRIPTION</th>
                  <th style={{ padding: '10px 12px', color: '#94a3b8' }}>DEPT</th>
                  <th style={{ padding: '10px 12px', color: '#94a3b8' }}>QTY</th>
                  <th style={{ padding: '10px 12px', color: '#94a3b8' }}>UNIT PRICE</th>
                  <th style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'right' }}>TOTAL AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                      {item.serviceName}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {item.department}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{item.quantity}</td>
                    <td style={{ padding: '12px' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Breakdown */}
        <div
          style={{
            maxWidth: '380px',
            marginLeft: 'auto',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Subtotal:</span>
            <span style={{ color: '#f8fafc', fontWeight: '600' }}>{formatCurrency(invoice.subtotal)}</span>
          </div>

          {Number(invoice.discountAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#10b981' }}>
              <span>Discounts:</span>
              <span>-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}

          {Number(invoice.taxAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
              <span>Tax / GST:</span>
              <span>+{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', fontWeight: '800', fontSize: '1.05rem' }}>
            <span style={{ color: '#f8fafc' }}>Total Invoiced:</span>
            <span style={{ color: '#d97706' }}>{formatCurrency(invoice.totalAmount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#10b981', fontWeight: '700' }}>
            <span>Amount Paid:</span>
            <span>{formatCurrency(invoice.paidAmount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '8px', fontWeight: '800', fontSize: '1.1rem' }}>
            <span style={{ color: Number(invoice.outstandingAmount) > 0 ? '#ef4444' : '#10b981' }}>
              Remaining Balance:
            </span>
            <span style={{ color: Number(invoice.outstandingAmount) > 0 ? '#ef4444' : '#10b981' }}>
              {formatCurrency(invoice.outstandingAmount)}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Payments & Receipts Ledger */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#10b981" /> Settled Payments & Receipts ({invoice.payments?.length || 0})
          </h3>
        </div>

        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem' }}>
            No payments have been recorded for this statement.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>RECEIPT #</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>DATE</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>METHOD</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>REFERENCE</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>RECEIVED BY</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>AMOUNT</th>
                  <th style={{ padding: '8px 12px', color: '#94a3b8' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#10b981' }}>{p.receiptNumber}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{formatDate(p.createdAt, true)}</td>
                    <td style={{ padding: '10px 12px' }}>{p.paymentMethod}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{p.referenceNumber || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{p.receivedBy?.fullName || 'Finance Staff'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '800', color: '#10b981' }}>+{formatCurrency(p.amount)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge variant={p.status === 'COMPLETED' ? 'teal' : 'danger'}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Billing Adjustments & Refunds Ledger */}
      {(invoice.adjustments?.length > 0 || invoice.refunds?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Adjustments */}
          {invoice.adjustments?.length > 0 && (
            <Card>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#d97706" /> Applied Adjustments
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invoice.adjustments.map((adj) => (
                  <div key={adj.id} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                      <span style={{ color: '#d97706' }}>{adj.type}</span>
                      <span>{formatCurrency(adj.amount)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{adj.reason}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Refunds */}
          {invoice.refunds?.length > 0 && (
            <Card>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} color="#a855f7" /> Issued Refunds
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invoice.refunds.map((ref) => (
                  <div key={ref.id} style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                      <span style={{ color: '#a855f7' }}>Refund #{ref.refundNumber}</span>
                      <span style={{ color: '#ef4444' }}>-{formatCurrency(ref.amount)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                      Status: <Badge variant={getStatusBadgeVariant(ref.status)}>{ref.status}</Badge> &bull; {ref.reason}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 5. Record Payment Modal */}
      {showPaymentModal && (
        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={`Settle Payment — ${invoice.invoiceNumber}`}>
          <form onSubmit={handlePaymentSubmit}>
            {actionError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionError}</div>}
            {actionSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionSuccess}</div>}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" max={invoice.outstandingAmount} className="med-form-input" style={{ width: '100%', fontSize: '1.1rem', fontWeight: '700' }} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Max balance: {formatCurrency(invoice.outstandingAmount)}</span>
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
                <input type="text" className="med-form-input" style={{ width: '100%' }} placeholder="e.g. TXN-12948" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Notes</label>
              <textarea className="med-form-textarea" style={{ width: '100%', height: '60px' }} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingPayment}>{submittingPayment ? 'Saving...' : 'Confirm Payment'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Apply Adjustment Modal */}
      {showAdjustmentModal && (
        <Modal isOpen={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} title={`Apply Adjustment — ${invoice.invoiceNumber}`}>
          <form onSubmit={handleAdjustmentSubmit}>
            {actionError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionError}</div>}
            {actionSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionSuccess}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Adjustment Type *</label>
                <select className="med-form-select" style={{ width: '100%' }} value={adjType} onChange={(e) => setAdjType(e.target.value)}>
                  <option value="CREDIT">CREDIT (Reduce Bill)</option>
                  <option value="DEBIT">DEBIT (Increase Bill)</option>
                  <option value="CORRECTION">CORRECTION</option>
                  <option value="WRITE_OFF">WRITE OFF</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Amount (₹) *</label>
                <input type="number" step="0.01" min="0.01" className="med-form-input" style={{ width: '100%' }} value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} required />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Mandatory Audit Reason *</label>
              <textarea className="med-form-textarea" style={{ width: '100%', height: '70px' }} placeholder="Specify why this adjustment is being applied..." value={adjReason} onChange={(e) => setAdjReason(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowAdjustmentModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingAdj}>{submittingAdj ? 'Applying...' : 'Apply Adjustment'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Request Refund Modal */}
      {showRefundModal && (
        <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title={`Request Refund — ${invoice.invoiceNumber}`}>
          <form onSubmit={handleRefundSubmit}>
            {actionError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionError}</div>}
            {actionSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionSuccess}</div>}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Refund Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" max={surplusAmount} className="med-form-input" style={{ width: '100%' }} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} required />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Max eligible surplus: {formatCurrency(surplusAmount)}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Reason for Refund *</label>
              <textarea className="med-form-textarea" style={{ width: '100%', height: '70px' }} placeholder="Explain why surplus refund is requested..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingRefund}>{submittingRefund ? 'Queueing...' : 'Queue for Senior Approval'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 8. Cancel Invoice Modal */}
      {showCancelModal && (
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title={`Cancel Invoice — ${invoice.invoiceNumber}`}>
          <form onSubmit={handleCancelSubmit}>
            {actionError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionError}</div>}
            {actionSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>{actionSuccess}</div>}

            <p style={{ fontSize: '0.88rem', color: '#fca5a5', marginBottom: '14px' }}>
              Warning: Cancelling an invoice voids all associated uncollected balances. This action is permanent and recorded in the audit trail.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Cancellation Reason *</label>
              <textarea className="med-form-textarea" style={{ width: '100%', height: '70px' }} placeholder="Specify reason for cancelling this bill..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCancelModal(false)}>Back</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingCancel} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                {submittingCancel ? 'Cancelling...' : 'Confirm Invoice Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantInvoiceDetailPage;
