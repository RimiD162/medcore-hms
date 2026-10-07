import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantRefundsPage = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Action Modals State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [modalActionType, setModalActionType] = useState(null); // 'APPROVE' | 'PROCESS' | 'REJECT'
  const [processMethod, setProcessMethod] = useState('BANK_TRANSFER');
  const [processRef, setProcessRef] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const res = await accountantApi.getRefunds(params);
      const data = res.data || res;
      setRefunds(data.refunds || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 20 });
    } catch (err) {
      setError(err.message || 'Failed to load refunds queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRefunds();
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search, page]);

  const handleOpenAction = (refund, type) => {
    setSelectedRefund(refund);
    setModalActionType(type);
    setProcessMethod('BANK_TRANSFER');
    setProcessRef('');
    setActionNotes('');
    setActionError(null);
    setActionSuccess(null);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;

    setSubmittingAction(true);
    setActionError(null);
    try {
      if (modalActionType === 'APPROVE') {
        await accountantApi.approveRefund(selectedRefund.id, { notes: actionNotes || undefined });
        setActionSuccess('Refund approved! Ready for payout disbursement.');
      } else if (modalActionType === 'PROCESS') {
        await accountantApi.processRefund(selectedRefund.id, {
          paymentMethod: processMethod,
          referenceNumber: processRef || undefined,
        });
        setActionSuccess('Refund disbursed and recorded in transaction stream!');
      } else if (modalActionType === 'REJECT') {
        if (!actionNotes.trim()) {
          setActionError('Rejection reason is required.');
          setSubmittingAction(false);
          return;
        }
        await accountantApi.rejectRefund(selectedRefund.id, { reason: actionNotes.trim() });
        setActionSuccess('Refund request rejected.');
      }

      setTimeout(() => {
        setSelectedRefund(null);
        setModalActionType(null);
        fetchRefunds();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RotateCcw size={28} color="#a855f7" /> Refunds & Returns Queue
            </h1>
            <span
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={13} /> 3-Stage Dual Control
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Strict separation-of-duties refund workflow: Request &rarr; Senior Approval &rarr; Disbursement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchRefunds}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/accountant/invoices')}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Request From Invoice
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Refund #, Invoice, Patient
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. REF-2026, Robert..."
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
              Lifecycle Status
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
              <option value="">All Lifecycle Stages</option>
              <option value="REQUESTED">REQUESTED (Pending Approval)</option>
              <option value="APPROVED">APPROVED (Awaiting Payout)</option>
              <option value="PROCESSED">PROCESSED (Disbursed)</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Refunds Table */}
      {loading ? (
        <LoadingState message="Loading refunds lifecycle ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRefunds} />
      ) : refunds.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <RotateCcw size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Refunds in Queue
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No hospital refund requests match the specified criteria.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>REFUND #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>INVOICE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>REASON</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>DUAL CONTROL ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((ref) => (
                  <tr key={ref.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 14px', fontWeight: '700', color: '#a855f7', fontSize: '0.92rem' }}>
                      {ref.refundNumber}
                    </td>

                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {formatDate(ref.createdAt)}
                    </td>

                    <td style={{ padding: '14px 14px', fontSize: '0.88rem' }}>
                      <span
                        style={{ color: '#d97706', cursor: 'pointer', fontWeight: '600' }}
                        onClick={() => navigate(`/app/accountant/invoices/${ref.invoiceId}`)}
                      >
                        {ref.invoice?.invoiceNumber || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.9rem' }}>
                        {ref.patient?.fullName || ref.invoice?.patient?.fullName || 'Patient'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {ref.patient?.patientIdNumber || ref.invoice?.patient?.patientIdNumber}
                      </div>
                    </td>

                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '240px' }}>
                      {ref.reason}
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '800', color: '#ef4444', fontSize: '0.95rem' }}>
                      -{formatCurrency(ref.amount)}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <Badge variant={getStatusBadgeVariant(ref.status)}>
                        {ref.status}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {ref.status === 'REQUESTED' && (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                              onClick={() => handleOpenAction(ref, 'APPROVE')}
                            >
                              <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => handleOpenAction(ref, 'REJECT')}
                            >
                              <XCircle size={13} style={{ marginRight: '4px' }} /> Reject
                            </Button>
                          </>
                        )}

                        {ref.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleOpenAction(ref, 'PROCESS')}
                          >
                            <RotateCcw size={13} style={{ marginRight: '4px' }} /> Disburse Payout
                          </Button>
                        )}

                        {ref.status === 'PROCESSED' && (
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>
                            Settled ({ref.paymentMethod || 'DISBURSED'})
                          </span>
                        )}
                      </div>
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
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} refunds)
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

      {/* 4. Action Modal (Approve / Process / Reject) */}
      {selectedRefund && modalActionType && (
        <Modal
          isOpen={!!selectedRefund}
          onClose={() => setSelectedRefund(null)}
          title={
            modalActionType === 'APPROVE'
              ? `Senior Finance Approval — ${selectedRefund.refundNumber}`
              : modalActionType === 'PROCESS'
              ? `Disburse Refund Payment — ${selectedRefund.refundNumber}`
              : `Reject Refund Request — ${selectedRefund.refundNumber}`
          }
        >
          <form onSubmit={handleActionSubmit}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Invoice Reference:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                  {selectedRefund.invoice?.invoiceNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Patient:</span>
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                  {selectedRefund.patient?.fullName || selectedRefund.invoice?.patient?.fullName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f87171' }}>Refund Amount:</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ef4444' }}>{formatCurrency(selectedRefund.amount)}</span>
              </div>
            </div>

            {actionError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {actionSuccess}
              </div>
            )}

            {modalActionType === 'PROCESS' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Payout Method *</label>
                  <select className="med-form-select" style={{ width: '100%' }} value={processMethod} onChange={(e) => setProcessMethod(e.target.value)}>
                    <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/IMPS)</option>
                    <option value="UPI">UPI / REFUND WALLET</option>
                    <option value="CASH">CASH DISBURSEMENT</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Disbursement Ref / Txn ID</label>
                  <input type="text" className="med-form-input" style={{ width: '100%' }} placeholder="e.g. UTR-984128" value={processRef} onChange={(e) => setProcessRef(e.target.value)} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                {modalActionType === 'REJECT' ? 'Mandatory Rejection Reason *' : 'Audit / Verification Notes'}
              </label>
              <textarea
                className="med-form-textarea"
                style={{ width: '100%', height: '70px' }}
                placeholder={modalActionType === 'REJECT' ? 'Specify why this refund is rejected...' : 'Optional approval / transaction notes...'}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                required={modalActionType === 'REJECT'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedRefund(null)} disabled={submittingAction}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={submittingAction}
                style={
                  modalActionType === 'REJECT'
                    ? { background: '#ef4444', borderColor: '#ef4444' }
                    : modalActionType === 'APPROVE'
                    ? { background: '#10b981', borderColor: '#10b981' }
                    : {}
                }
              >
                {submittingAction
                  ? 'Saving...'
                  : modalActionType === 'APPROVE'
                  ? 'Approve Refund Request'
                  : modalActionType === 'PROCESS'
                  ? 'Disburse & Settle Refund'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantRefundsPage;
