import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  DollarSign,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistInvoicesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const res = await receptionistApi.getInvoices(params);
      const data = res.data || res;
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 20 });
    } catch (err) {
      setError(err.message || 'Failed to load invoices registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search, page]);

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={28} color="#00d2b4" /> Invoices & Billing Registry
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Hospital financial records, patient billing statements, and payment status tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/receptionist/billing')}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Create New Invoice
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Invoice #, Patient Name or ID
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. INV-2026-0001, Eleanor..."
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
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Invoices Table */}
      {loading ? (
        <LoadingState message="Loading invoices ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInvoices} />
      ) : invoices.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Invoices Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              No billing statements match the specified search filters.
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
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT NAME</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TOTAL</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PAID</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>BALANCE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 14px', fontWeight: '700', color: '#00d2b4', fontSize: '0.9rem' }}>
                      {inv.invoiceNumber}
                    </td>

                    <td style={{ padding: '14px 14px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <div
                        style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/app/receptionist/patients/${inv.patientId}`)}
                      >
                        {inv.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {inv.patient?.patientIdNumber} &bull; {inv.patient?.phone}
                      </div>
                    </td>

                    <td style={{ padding: '14px 14px', fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                      ${Number(inv.totalAmount).toFixed(2)}
                    </td>

                    <td style={{ padding: '14px 14px', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                      ${Number(inv.paidAmount).toFixed(2)}
                    </td>

                    <td style={{ padding: '14px 14px', color: Number(inv.outstandingAmount) > 0 ? '#ef4444' : '#94a3b8', fontWeight: '700', fontSize: '0.9rem' }}>
                      ${Number(inv.outstandingAmount).toFixed(2)}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <Badge
                        variant={
                          inv.status === 'PAID'
                            ? 'teal'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'amber'
                            : 'danger'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button
                          variant="outline"
                          size="xs"
                          title="View Bill Details"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} /> View
                        </Button>
                        {Number(inv.outstandingAmount) > 0 && (
                          <Button
                            variant="primary"
                            size="xs"
                            title="Collect Payment"
                            onClick={() => navigate(`/app/receptionist/payments?invoiceId=${inv.id}`)}
                          >
                            <DollarSign size={13} style={{ marginRight: '4px' }} /> Collect
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
                Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} invoices)
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Hospital Bill Statement — ${selectedInvoice.invoiceNumber}`}
        >
          <div style={{ padding: '8px 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {selectedInvoice.patient?.fullName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#00d2b4', marginTop: '2px' }}>
                  {selectedInvoice.patient?.patientIdNumber} &bull; {selectedInvoice.patient?.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge variant={selectedInvoice.status === 'PAID' ? 'teal' : 'danger'}>
                  {selectedInvoice.status}
                </Badge>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
                Itemized Hospital Services
              </div>
              <table className="med-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', color: '#94a3b8' }}>SERVICE</th>
                    <th style={{ padding: '6px 8px', color: '#94a3b8' }}>QTY</th>
                    <th style={{ padding: '6px 8px', color: '#94a3b8' }}>RATE</th>
                    <th style={{ padding: '6px 8px', color: '#94a3b8', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '8px' }}>{item.serviceName}</td>
                      <td style={{ padding: '8px' }}>{item.quantity}</td>
                      <td style={{ padding: '8px' }}>${Number(item.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Subtotal:</span>
                <span style={{ color: '#f8fafc' }}>${Number(selectedInvoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(selectedInvoice.discountAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#10b981' }}>
                  <span>Discount:</span>
                  <span>-${Number(selectedInvoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedInvoice.taxAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
                  <span>Tax:</span>
                  <span>+${Number(selectedInvoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px', fontWeight: '700', fontSize: '0.95rem' }}>
                <span style={{ color: '#f8fafc' }}>Total Due:</span>
                <span style={{ color: '#00d2b4' }}>${Number(selectedInvoice.totalAmount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.85rem' }}>
                <span style={{ color: '#34d399' }}>Amount Paid:</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>${Number(selectedInvoice.paidAmount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.95rem', fontWeight: '700' }}>
                <span style={{ color: '#f87171' }}>Remaining Balance:</span>
                <span style={{ color: '#ef4444' }}>${Number(selectedInvoice.outstandingAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer size={14} style={{ marginRight: '6px' }} /> Print Receipt
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                {Number(selectedInvoice.outstandingAmount) > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(null);
                      navigate(`/app/receptionist/payments?invoiceId=${selectedInvoice.id}`);
                    }}
                  >
                    Collect Payment &rarr;
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReceptionistInvoicesPage;
