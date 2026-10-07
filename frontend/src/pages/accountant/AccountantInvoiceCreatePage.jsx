import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Trash2,
  Search,
  User,
  Calendar,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  Calculator,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, roundMoney } from '../../utils/financeFormatters';

const DEFAULT_CATALOG_ITEMS = [
  { name: 'General Physician Consultation (OPD)', department: 'OPD', unitPrice: 500 },
  { name: 'Specialist Cardiology Consultation', department: 'CARDIOLOGY', unitPrice: 1200 },
  { name: 'General Ward Bed Charge (per day)', department: 'INPATIENT', unitPrice: 2000 },
  { name: 'ICU High Dependency Bed (per day)', department: 'ICU', unitPrice: 6500 },
  { name: 'Complete Blood Count (CBC) Profile', department: 'LABORATORY', unitPrice: 450 },
  { name: 'Comprehensive Metabolic Panel (CMP)', department: 'LABORATORY', unitPrice: 850 },
  { name: 'Lipid Profile & Serum Cholesterol', department: 'LABORATORY', unitPrice: 650 },
  { name: 'Standard Nursing Care & Vitals Triage', department: 'NURSING', unitPrice: 350 },
  { name: 'Emergency Room Intake & Stabilization', department: 'EMERGENCY', unitPrice: 1500 },
  { name: 'Pharmaceutical Dispensary Prescription', department: 'PHARMACY', unitPrice: 480 },
];

export const AccountantInvoiceCreatePage = () => {
  const navigate = useNavigate();

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Invoice form state
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { serviceName: 'General Physician Consultation (OPD)', department: 'OPD', quantity: 1, unitPrice: 500, discount: 0, tax: 0 },
  ]);

  // Overall discount and tax adjustments
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState(0);
  const [invoiceTaxAmount, setInvoiceTaxAmount] = useState(0);

  // Status state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Debounced search for patients
  useEffect(() => {
    if (!patientSearch || patientSearch.trim().length < 2) {
      setPatientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await accountantApi.searchPatients({ search: patientSearch.trim(), limit: 8 });
        const list = res.data?.patients || res.data || [];
        setPatientResults(list);
      } catch (err) {
        console.error('Patient search error:', err);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Add line item
  const handleAddItem = (preset = null) => {
    if (preset) {
      setItems((prev) => [
        ...prev,
        {
          serviceName: preset.name,
          department: preset.department,
          quantity: 1,
          unitPrice: preset.unitPrice,
          discount: 0,
          tax: 0,
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        { serviceName: '', department: 'GENERAL', quantity: 1, unitPrice: 0, discount: 0, tax: 0 },
      ]);
    }
  };

  // Remove line item
  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update line item field
  const handleItemChange = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Client-side preview calculations using Symmetric Half-Up Rounding
  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const roundedSubtotal = roundMoney(subtotal);
  const totalDiscounts = roundMoney(Number(invoiceDiscountAmount) || 0);
  const totalTaxes = roundMoney(Number(invoiceTaxAmount) || 0);
  const calculatedTotal = roundMoney(Math.max(0, roundedSubtotal - totalDiscounts + totalTaxes));

  // Submit invoice
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setFormError('Please select a patient for this hospital invoice.');
      return;
    }

    if (items.length === 0) {
      setFormError('Please add at least one line item to the invoice.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].serviceName.trim()) {
        setFormError(`Item #${i + 1} is missing a service name / description.`);
        return;
      }
      if (Number(items[i].unitPrice) < 0 || Number(items[i].quantity) <= 0) {
        setFormError(`Item #${i + 1} has invalid quantity or price.`);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        patientId: selectedPatient.id,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        discountAmount: Number(invoiceDiscountAmount) || 0,
        taxAmount: Number(invoiceTaxAmount) || 0,
        items: items.map((it) => ({
          serviceName: it.serviceName.trim(),
          department: it.department || 'GENERAL',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      };

      const res = await accountantApi.createInvoice(payload);
      const created = res.data || res;
      navigate(`/app/accountant/invoices/${created.id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to create invoice statement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/accountant/invoices')}>
            <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Invoices Registry
          </Button>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={26} color="#d97706" /> Generate Hospital Bill
          </h1>
        </div>
      </div>

      {formError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} /> {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* 2. Patient Selection Box */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#00d2b4" /> 1. Select Patient
            </h3>

            {!selectedPatient ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                  Search Patient Name, Phone or ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="med-form-input"
                    style={{ width: '100%', paddingLeft: '36px' }}
                    placeholder="Type at least 2 characters..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                </div>

                {/* Patient Results Dropdown */}
                {patientResults.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      marginTop: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    }}
                  >
                    {patientResults.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientResults([]);
                          setPatientSearch('');
                        }}
                      >
                        <div style={{ fontWeight: '700', color: '#00d2b4', fontSize: '0.9rem' }}>{p.fullName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          ID: {p.patientIdNumber} &bull; {p.phone || 'No phone'} &bull; {p.gender}, {p.age}y
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(0, 210, 180, 0.06)',
                  border: '1px solid rgba(0, 210, 180, 0.25)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#00d2b4' }}>
                      {selectedPatient.fullName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main, #f8fafc)', marginTop: '2px' }}>
                      ID: {selectedPatient.patientIdNumber} &bull; Phone: {selectedPatient.phone || '—'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                      {selectedPatient.gender} &bull; {selectedPatient.age} years &bull; Blood: {selectedPatient.bloodGroup || '—'}
                    </div>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => setSelectedPatient(null)}>
                    Change Patient
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 3. Invoice Metadata Box */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#d97706" /> 2. Invoice Terms
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                Payment Due Date *
              </label>
              <input
                type="date"
                className="med-form-input"
                style={{ width: '100%' }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
                Clerk / Clinical Remarks
              </label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Standard consultation bill, OPD discharge..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* 4. Quick Catalog Presets Row */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
              Quick Add From Standard Hospital Catalog:
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {DEFAULT_CATALOG_ITEMS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-main, #f8fafc)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d97706')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
                onClick={() => handleAddItem(item)}
              >
                <Plus size={12} color="#d97706" /> {item.name} ({formatCurrency(item.unitPrice)})
              </button>
            ))}
          </div>
        </Card>

        {/* 5. Line Items Builder Table */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="#00d2b4" /> 3. Itemized Hospital Services ({items.length})
            </h3>
            <Button variant="outline" size="xs" onClick={() => handleAddItem(null)}>
              <Plus size={13} style={{ marginRight: '4px' }} /> Add Custom Item
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '8px', color: '#94a3b8', width: '40%' }}>SERVICE / PROCEDURE DESCRIPTION</th>
                  <th style={{ padding: '8px', color: '#94a3b8', width: '20%' }}>DEPARTMENT</th>
                  <th style={{ padding: '8px', color: '#94a3b8', width: '12%' }}>QTY</th>
                  <th style={{ padding: '8px', color: '#94a3b8', width: '16%' }}>UNIT PRICE (₹)</th>
                  <th style={{ padding: '8px', color: '#94a3b8', textAlign: 'right', width: '12%' }}>LINE TOTAL</th>
                  <th style={{ padding: '8px', width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = roundMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          className="med-form-input"
                          style={{ width: '100%' }}
                          placeholder="e.g. Consultation, ECG, Ultrasound..."
                          value={item.serviceName}
                          onChange={(e) => handleItemChange(idx, 'serviceName', e.target.value)}
                          required
                        />
                      </td>

                      <td style={{ padding: '8px' }}>
                        <select
                          className="med-form-select"
                          style={{ width: '100%' }}
                          value={item.department}
                          onChange={(e) => handleItemChange(idx, 'department', e.target.value)}
                        >
                          <option value="OPD">OPD Consultations</option>
                          <option value="INPATIENT">Inpatient & Wards</option>
                          <option value="ICU">ICU Critical Care</option>
                          <option value="CARDIOLOGY">Cardiology</option>
                          <option value="LABORATORY">Diagnostic Lab</option>
                          <option value="PHARMACY">Pharmacy</option>
                          <option value="NURSING">Nursing</option>
                          <option value="EMERGENCY">Emergency Triage</option>
                          <option value="GENERAL">General Hospital</option>
                        </select>
                      </td>

                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          className="med-form-input"
                          style={{ width: '100%' }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>

                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="med-form-input"
                          style={{ width: '100%' }}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          required
                        />
                      </td>

                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>
                        {formatCurrency(lineTotal)}
                      </td>

                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          title="Remove Line"
                          disabled={items.length <= 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: items.length <= 1 ? '#475569' : '#ef4444',
                            cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                          }}
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 6. Summary Totals Box */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              maxWidth: '420px',
              marginLeft: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Subtotal:</span>
              <span style={{ fontWeight: '600', color: '#f8fafc' }}>{formatCurrency(roundedSubtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Discount (₹):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="med-form-input"
                style={{ width: '120px', textAlign: 'right', height: '32px' }}
                value={invoiceDiscountAmount}
                onChange={(e) => setInvoiceDiscountAmount(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Tax / GST (₹):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="med-form-input"
                style={{ width: '120px', textAlign: 'right', height: '32px' }}
                value={invoiceTaxAmount}
                onChange={(e) => setInvoiceTaxAmount(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '10px',
                marginTop: '10px',
                fontSize: '1.15rem',
                fontWeight: '800',
              }}
            >
              <span style={{ color: '#f8fafc' }}>Total Invoice Amount:</span>
              <span style={{ color: '#d97706' }}>{formatCurrency(calculatedTotal)}</span>
            </div>
          </div>
        </Card>

        {/* 7. Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" size="md" type="button" onClick={() => navigate('/app/accountant/invoices')}>
            Discard & Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={submitting}>
            {submitting ? 'Generating Statement...' : 'Generate & Issue Invoice Statement'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountantInvoiceCreatePage;
