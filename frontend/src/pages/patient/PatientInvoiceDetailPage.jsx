import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Receipt,
  Calendar,
  DollarSign,
  Clock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  Info,
  Sparkles,
  X,
  FileCheck2,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientInvoiceDetailPage = () => {
  const { invoiceId } = useParams();
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CARD');
  const [processingPay, setProcessingPay] = useState(false);
  const [paySuccess, setPaySuccess] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await patientApi.getInvoiceById(invoiceId);
      if (res.data && res.data.invoice) {
        setInvoice(res.data.invoice);
        setPayAmount(String(res.data.invoice.balanceAmount || res.data.invoice.totalAmount || '0'));
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      setError(err.message || 'Unable to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchDetail();
    }
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleStartPayment = () => {
    setPaySuccess(null);
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      setProcessingPay(true);
      const parsedAmount = parseFloat(payAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        if (onShowToast) onShowToast('Please enter a valid payment amount');
        return;
      }

      // 1. Create Payment Intent
      const intentRes = await patientApi.createPaymentIntent(invoiceId, {
        amount: parsedAmount,
        paymentMethod: payMethod,
      });

      const attemptId = intentRes.data?.paymentAttemptId || intentRes.data?.id;

      // 2. Confirm Payment
      const confirmRes = await patientApi.confirmPayment(attemptId, {
        transactionReference: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      });

      setPaySuccess(confirmRes.data || { success: true });
      if (onShowToast) onShowToast('Payment completed successfully!');
      
      // Refresh invoice data
      await fetchDetail();
    } catch (err) {
      console.error('Payment failed', err);
      if (onShowToast) onShowToast(err.message || 'Payment processing failed');
    } finally {
      setProcessingPay(false);
    }
  };

  if (loading && !invoice) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: 60, borderRadius: 12, backgroundColor: 'rgba(217, 119, 6, 0.08)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 350, borderRadius: 16, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }} />
      </div>
    );
  }

  if (error || !invoice) {
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
          Billing Invoice Not Found
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)', maxWidth: 460 }}>
          {error || 'The requested invoice could not be retrieved.'}
        </p>
        <Link
          to="/app/patient/billing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Billing Statements</span>
        </Link>
      </div>
    );
  }

  const dateFormatted = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Statement Date';

  const isPaid = invoice.status === 'PAID';
  const balance = Number(invoice.balanceAmount || (isPaid ? 0 : invoice.totalAmount)).toFixed(2);

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
          to="/app/patient/billing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#0284c7',
            textDecoration: 'none',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Billing Statements</span>
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
            <span>Print Statement</span>
          </button>

          {!isPaid && parseFloat(balance) > 0 && (
            <button
              onClick={handleStartPayment}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.25rem',
                borderRadius: 8,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <CreditCard size={15} />
              <span>Pay Outstanding (${balance})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice Statement Card ───────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
      }}>
        {/* Header Header Strip */}
        <div style={{
          background: isPaid ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
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
                {invoice.invoiceNumber || `INV-${invoice.id?.substring(0, 8).toUpperCase()}`}
              </span>
              <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                {dateFormatted}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Hospital Itemized Statement
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
              Statement Status
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {invoice.status || 'UNPAID'}
            </div>
            {invoice.dueDate && (
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                Due by {new Date(invoice.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Body */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Itemized Line Items Table */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Itemized Clinical & Pharmacy Services
            </h3>

            <div style={{
              overflowX: 'auto',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 12,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--subcard-bg, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>#</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Service / Description</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Department</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Qty</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Unit Rate</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #64748b)' }}>
                          {item.category || 'Clinical Care'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #334155)' }}>
                          {item.quantity || 1}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #334155)' }}>
                          ${Number(item.unitPrice || item.totalAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', textAlign: 'right' }}>
                          ${Number(item.totalAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                        No itemized charges found for this statement.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Summary Table */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
              borderRadius: 12,
              padding: '1.25rem',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.88rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                <span>Subtotal</span>
                <span>${Number(invoice.subtotal || invoice.totalAmount || 0).toFixed(2)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #64748b)' }}>
                  <span>Tax & Healthcare Surcharge</span>
                  <span>+${Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Discount Applied</span>
                  <span>-${Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary, #0f172a)' }}>
                <span>Total Gross Amount</span>
                <span>${Number(invoice.totalAmount || 0).toFixed(2)}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>Payments Received</span>
                  <span>-${Number(invoice.paidAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{
                borderTop: '2px solid var(--border-color, #cbd5e1)',
                paddingTop: '0.6rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '1.15rem',
                color: isPaid ? '#059669' : '#ef4444',
              }}>
                <span>Remaining Balance Due</span>
                <span>${balance}</span>
              </div>
            </div>
          </div>

          {/* Insurance Claim Information if present */}
          {invoice.insuranceClaim && (
            <div style={{
              backgroundColor: 'rgba(2, 132, 199, 0.05)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: 12,
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#0284c7' }}>
                  Linked Insurance Coverage
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.2rem' }}>
                  {invoice.insuranceClaim.provider || 'Primary Healthcare Insurer'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.15rem' }}>
                  Claim #{invoice.insuranceClaim.claimNumber || invoice.insuranceClaim.id} &bull; Claimed: ${Number(invoice.insuranceClaim.claimedAmount || 0).toFixed(2)}
                </div>
              </div>

              <div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.8rem',
                  borderRadius: 20,
                  backgroundColor: invoice.insuranceClaim.status === 'APPROVED' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                  color: invoice.insuranceClaim.status === 'APPROVED' ? '#059669' : '#d97706',
                  textTransform: 'uppercase',
                }}>
                  Claim {invoice.insuranceClaim.status || 'SUBMITTED'}
                </span>
              </div>
            </div>
          )}

          {/* Payment Receipts History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                Processed Payment Transactions ({invoice.payments.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {invoice.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: 10,
                      backgroundColor: 'var(--subcard-bg, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.86rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        Payment Ref #{p.paymentNumber || p.id?.substring(0, 8)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
                        Method: {p.method || 'Card'} &bull; {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'Confirmed'}
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#059669' }}>
                      +${Number(p.amount || 0).toFixed(2)} Paid
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Interactive Payment Modal ─────────────────────────────────── */}
      {showPayModal && (
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
            maxWidth: 480,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color, #cbd5e1)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Pay Hospital Statement
                </h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {paySuccess ? (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    Payment Successful!
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
                    Your payment was verified and applied to invoice #{invoice.invoiceNumber}.
                  </p>
                  <button
                    onClick={() => setShowPayModal(false)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.6rem 1.5rem',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.4rem' }}>
                      Payment Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={balance}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: 8,
                        border: '1px solid var(--border-color, #cbd5e1)',
                        background: 'var(--input-bg, #f8fafc)',
                        color: 'var(--text-primary, #0f172a)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                      required
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.25rem' }}>
                      Remaining Balance Due: <strong>${balance}</strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.4rem' }}>
                      Payment Channel
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {[
                        { id: 'CARD', label: 'Credit / Debit Card' },
                        { id: 'UPI', label: 'UPI / QR Scan' },
                        { id: 'NET_BANKING', label: 'Net Banking' },
                        { id: 'WALLET', label: 'Hospital Wallet' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id)}
                          style={{
                            padding: '0.65rem',
                            borderRadius: 8,
                            border: payMethod === m.id ? '2px solid #0284c7' : '1px solid var(--border-color, #cbd5e1)',
                            backgroundColor: payMethod === m.id ? 'rgba(2, 132, 199, 0.08)' : 'var(--card-bg, #ffffff)',
                            color: payMethod === m.id ? '#0284c7' : 'var(--text-primary, #334155)',
                            fontWeight: payMethod === m.id ? 700 : 500,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    backgroundColor: 'rgba(2, 132, 199, 0.05)',
                    border: '1px solid rgba(2, 132, 199, 0.15)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary, #64748b)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <ShieldCheck size={16} color="#0284c7" />
                    <span>256-bit Encrypted Hospital Payment Gateway Sandbox</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowPayModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: 8,
                        border: '1px solid var(--border-color, #cbd5e1)',
                        background: 'transparent',
                        color: 'var(--text-primary, #334155)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingPay}
                      style={{
                        flex: 1.5,
                        padding: '0.65rem',
                        borderRadius: 8,
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        cursor: processingPay ? 'not-allowed' : 'pointer',
                        opacity: processingPay ? 0.7 : 1,
                      }}
                    >
                      {processingPay ? 'Processing...' : `Authorize $${payAmount}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInvoiceDetailPage;
