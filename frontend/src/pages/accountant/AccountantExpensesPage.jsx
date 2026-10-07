import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

const EXPENSE_CATEGORIES = [
  'MEDICAL_SUPPLIES',
  'EQUIPMENT',
  'FACILITY',
  'UTILITIES',
  'PHARMACEUTICALS',
  'SALARIES',
  'MAINTENANCE',
  'ADMINISTRATIVE',
  'OTHER',
];

export const AccountantExpensesPage = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Record Expense Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'MEDICAL_SUPPLIES',
    vendor: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [formError, setFormError] = useState(null);

  // Approve / Cancel Modals
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [modalType, setModalType] = useState(null); // 'APPROVE' | 'CANCEL'
  const [cancelReason, setCancelReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const res = await accountantApi.getExpenses(params);
      const data = res.data || res;
      setExpenses(data.expenses || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 20 });

      // Fetch categories summary
      const catRes = await accountantApi.getExpenseCategories();
      setCategoriesSummary(catRes.data || catRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load expenses registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [category, status, search, page]);

  // Check for duplicates when vendor and amount change
  useEffect(() => {
    if (!formData.vendor || !formData.amount || Number(formData.amount) <= 0) {
      setDuplicateWarning(null);
      return;
    }

    const match = expenses.find(
      (e) =>
        e.vendor.toLowerCase() === formData.vendor.trim().toLowerCase() &&
        Math.abs(Number(e.amount) - Number(formData.amount)) < 0.01 &&
        e.status !== 'CANCELLED'
    );

    if (match) {
      setDuplicateWarning(
        `Potential Duplicate: An active expense for "${match.vendor}" with ${formatCurrency(match.amount)} was recorded on ${formatDate(match.expenseDate)}.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.vendor, formData.amount, expenses]);

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor.trim() || !formData.description.trim() || Number(formData.amount) <= 0) {
      setFormError('Please fill out all mandatory fields with valid values.');
      return;
    }

    setSubmittingExpense(true);
    setFormError(null);
    try {
      await accountantApi.createExpense({
        category: formData.category,
        vendor: formData.vendor.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      setShowCreateModal(false);
      setFormData({
        category: 'MEDICAL_SUPPLIES',
        vendor: '',
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: '',
        notes: '',
      });
      fetchExpenses();
    } catch (err) {
      setFormError(err.message || 'Failed to record expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handle Approve / Cancel Action
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmittingAction(true);
    try {
      if (modalType === 'APPROVE') {
        await accountantApi.approveExpense(selectedExpense.id);
      } else if (modalType === 'CANCEL') {
        if (!cancelReason.trim()) {
          alert('Cancellation reason is required.');
          setSubmittingAction(false);
          return;
        }
        await accountantApi.cancelExpense(selectedExpense.id, { reason: cancelReason.trim() });
      }

      setSelectedExpense(null);
      setModalType(null);
      setCancelReason('');
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={28} color="#ef4444" /> Hospital Operational Expenses
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Vendor disbursements, facility maintenance, pharmaceuticals procurement, and hospital overheads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchExpenses}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setFormError(null); setShowCreateModal(true); }}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Record New Expense
          </Button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          style={{
            background: !category ? '#d97706' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
          onClick={() => { setCategory(''); setPage(1); }}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <button
              key={cat}
              type="button"
              style={{
                background: isSelected ? '#d97706' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: isSelected ? '#fff' : 'var(--text-muted, #94a3b8)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>

      {/* 3. Search & Status Filter */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Vendor, Description, Ref #
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. MedSupply Co, Oxygen Refill..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Expense Status
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING (Awaiting Review)</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Expenses Table */}
      {loading ? (
        <LoadingState message="Loading hospital expenses..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchExpenses} />
      ) : expenses.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <CreditCard size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Expenses Recorded
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No operational expenses match the specified filters.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>EXPENSE #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>CATEGORY</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>VENDOR</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 14px', fontWeight: '700', color: '#d97706', fontSize: '0.92rem' }}>
                      {exp.expenseNumber}
                    </td>

                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {formatDate(exp.expenseDate || exp.createdAt)}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: '600',
                        }}
                      >
                        {exp.category.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                      {exp.vendor}
                    </td>

                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '260px' }}>
                      {exp.description}
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '800', color: '#ef4444', fontSize: '0.95rem' }}>
                      -{formatCurrency(exp.amount)}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <Badge variant={getStatusBadgeVariant(exp.status)}>
                        {exp.status}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {exp.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="xs"
                            style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            onClick={() => { setSelectedExpense(exp); setModalType('APPROVE'); }}
                          >
                            <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> Approve
                          </Button>
                        )}
                        {exp.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="xs"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            onClick={() => { setSelectedExpense(exp); setModalType('CANCEL'); setCancelReason(''); }}
                          >
                            <Ban size={13} style={{ marginRight: '4px' }} /> Cancel
                          </Button>
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
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} expenses)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}>
                  Next <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5. Record Expense Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Operational Expense">
          <form onSubmit={handleCreateSubmit}>
            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            {duplicateWarning && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fcd34d', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {duplicateWarning}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Category *</label>
                <select
                  className="med-form-select"
                  style={{ width: '100%' }}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Vendor / Payee Name *</label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Apex Medical Devices"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="med-form-input"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: '700' }}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Expense Date *</label>
                <input
                  type="date"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Payment Method</label>
                <select
                  className="med-form-select"
                  style={{ width: '100%' }}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="CARD">CORPORATE CARD</option>
                  <option value="UPI">UPI / DIRECT</option>
                  <option value="CASH">PETTY CASH</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Reference / PO #</label>
                <input
                  type="text"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. PO-8812, INV-9821"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Description *</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Monthly oxygen cylinder replenishments..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Notes / Remarks</label>
              <textarea
                className="med-form-textarea"
                style={{ width: '100%', height: '60px' }}
                placeholder="Optional bookkeeping notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)} disabled={submittingExpense}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingExpense}>
                {submittingExpense ? 'Recording...' : 'Record Operational Expense'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Cancel Expense Modal */}
      {selectedExpense && modalType === 'CANCEL' && (
        <Modal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title={`Cancel Expense — ${selectedExpense.expenseNumber}`}>
          <form onSubmit={handleActionSubmit}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ color: '#f87171', fontWeight: '700', marginBottom: '4px' }}>Cancel Expense Voucher</div>
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
                Cancelling this expense of <strong>{formatCurrency(selectedExpense.amount)}</strong> will mark the voucher void and remove its cash outflow from derived financial transaction streams.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Cancellation Reason *</label>
              <textarea
                className="med-form-textarea"
                style={{ width: '100%', height: '70px' }}
                placeholder="State reason for cancelling this expense..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedExpense(null)}>Back</Button>
              <Button variant="primary" size="sm" type="submit" disabled={submittingAction} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                {submittingAction ? 'Cancelling...' : 'Confirm Expense Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantExpensesPage;
