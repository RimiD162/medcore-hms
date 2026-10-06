import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  Receipt,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistBillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onShowToast } = useOutletContext() || {};

  const preselectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Invoice Form State
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [billingError, setBillingError] = useState(null);

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const [patRes, catRes] = await Promise.all([
          receptionistApi.getPatients({ limit: 100 }),
          receptionistApi.getServiceCatalog(),
        ]);
        const patData = patRes.data || patRes;
        const catData = catRes.data || catRes;
        setPatients(patData.patients || []);
        setServiceCatalog(catData || []);

        if (catData?.length > 0) {
          setSelectedCatalogId(catData[0].id);
        }
      } catch (err) {
        console.error('Failed to load billing catalog', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadBillingData();
  }, []);

  const handleAddItem = () => {
    const catalogItem = serviceCatalog.find((c) => c.id === selectedCatalogId);
    if (!catalogItem) return;

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.serviceCatalogId === catalogItem.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += parseInt(itemQuantity, 10) || 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          serviceCatalogId: catalogItem.id,
          serviceCode: catalogItem.code,
          serviceName: catalogItem.name,
          category: catalogItem.category,
          unitPrice: Number(catalogItem.unitPrice),
          quantity: parseInt(itemQuantity, 10) || 1,
        },
      ]);
    }
    setItemQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateQuantity = (index, qty) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setItems(updated);
  };

  // Preview Totals
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const taxAmount = (taxableAmount * (Math.max(0, Number(taxRate) || 0))) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setBillingError('Please select a patient to bill.');
      return;
    }
    if (items.length === 0) {
      setBillingError('Please add at least one billable service item from catalog.');
      return;
    }

    setSubmitting(true);
    setBillingError(null);

    try {
      const payload = {
        patientId: selectedPatientId,
        discountAmount: discountVal,
        taxRate: Number(taxRate) || 0,
        notes: notes || undefined,
        items: items.map((i) => ({
          serviceCatalogId: i.serviceCatalogId,
          serviceName: i.serviceName,
          quantity: i.quantity,
        })),
      };

      const res = await receptionistApi.createInvoice(payload);
      const invoice = res.data || res;

      if (onShowToast) {
        onShowToast(`Invoice ${invoice.invoiceNumber} created! Total: $${Number(invoice.totalAmount).toFixed(2)}`);
      }

      navigate(`/app/receptionist/payments?invoiceId=${invoice.id}`);
    } catch (err) {
      setBillingError(err.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return <LoadingState message="Loading service catalog & patient accounts..." />;
  }

  return (
    <div className="med-page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/invoices')}>
            <ArrowLeft size={16} /> Back to Invoices
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
              Create Front Desk Invoice
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Server-authoritative pricing based on authorized hospital service catalog rates.
            </p>
          </div>
        </div>
      </div>

      {billingError && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{billingError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitInvoice}>
        {/* Section 1: Select Patient */}
        <Card title="1. Patient Account" style={{ marginBottom: '20px' }}>
          <div>
            <label className="med-form-label">Bill To Patient *</label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Choose Patient from Directory --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.patientIdNumber}) &bull; {p.phone}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Section 2: Service Catalog Item Selector */}
        <Card title="2. Add Items from Service Catalog" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <label className="med-form-label">Hospital Service Item</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                {serviceCatalog.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.code}] {cat.name} ({cat.category}) — ${Number(cat.unitPrice).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="med-form-label">Quantity</label>
              <input
                type="number"
                className="med-form-input"
                style={{ width: '100%' }}
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
              />
            </div>

            <Button type="button" variant="primary" onClick={handleAddItem}>
              <Plus size={16} style={{ marginRight: '4px' }} /> Add Item
            </Button>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              No services added to this invoice yet. Select an item above and click "Add Item".
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>CODE</th>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>SERVICE NAME</th>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>UNIT RATE</th>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8', width: '100px' }}>QTY</th>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                    <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#00d2b4', fontWeight: '700' }}>
                        {item.serviceCode}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: '600' }}>
                        {item.serviceName}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="number"
                          className="med-form-input"
                          style={{ width: '70px', padding: '4px 8px' }}
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#f8fafc' }}>
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <Button variant="danger" size="xs" onClick={() => handleRemoveItem(idx)}>
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Section 3: Summary & Discounts */}
        <Card title="3. Invoice Summary & Taxes" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="med-form-label">Discount Amount ($)</label>
              <input
                type="number"
                className="med-form-input"
                style={{ width: '100%' }}
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="med-form-label">Tax Rate (%)</label>
              <input
                type="number"
                className="med-form-input"
                style={{ width: '100%' }}
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="med-form-label">Invoice Notes / Billing Remarks</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. OPD Consultation and Routine Lab Screen"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Live Calculation Breakdown */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Subtotal:</span>
              <strong style={{ color: '#f8fafc' }}>${subtotal.toFixed(2)}</strong>
            </div>
            {discountVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', color: '#10b981' }}>
                <span>Discount Applied:</span>
                <span>-${discountVal.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', color: '#94a3b8' }}>
                <span>Tax ({taxRate}%):</span>
                <span>+${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', marginTop: '6px', fontSize: '1.2rem', fontWeight: '800' }}>
              <span style={{ color: '#f8fafc' }}>Grand Total Due:</span>
              <span style={{ color: '#00d2b4' }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/app/receptionist/invoices')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || items.length === 0 || !selectedPatientId}>
            <Receipt size={16} style={{ marginRight: '6px' }} />
            {submitting ? 'Generating Invoice...' : 'Generate Invoice & Proceed to Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReceptionistBillingPage;
