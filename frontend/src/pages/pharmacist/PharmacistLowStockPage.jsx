import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Boxes,
  Eye,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Package,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, StatCard, Badge, Button, Modal, InputField, SelectField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistLowStockPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [urgency, setUrgency] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  // Receive modal state
  const [receiveMed, setReceiveMed] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    supplier: 'MedCore Central Pharma Distributors',
    invoiceReference: '',
    batchNumber: '',
    quantityReceived: 100,
    purchaseCost: '',
    sellingPrice: '',
    expiryDate: '2027-12-31',
    notes: 'Restock generated from Low-Stock alert triage',
  });
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getLowStock({
        urgency: urgency !== 'ALL' ? urgency : undefined,
        category: category !== 'ALL' ? category : undefined,
        limit: 50,
      }),
    [urgency, category]
  );

  const lowStockList = data?.lowStock || [];
  const summary = data?.summary || {};

  const handleOpenRestock = (med) => {
    setReceiveMed(med);
    setReceiveForm({
      supplier: 'MedCore Central Pharma Distributors',
      invoiceReference: `INV-${Date.now().toString().slice(-6)}`,
      batchNumber: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      quantityReceived: (med.deficit || 50) + 50,
      purchaseCost: 3.50,
      sellingPrice: Number(med.sellingPrice) || '',
      expiryDate: '2027-12-31',
      notes: `Urgent replenishment for ${med.name} (Deficit: ${med.deficit} ${med.unit})`,
    });
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!receiveMed || !receiveForm.batchNumber.trim() || !receiveForm.expiryDate || receiveForm.quantityReceived <= 0) {
      if (onShowToast) onShowToast('Please fill all mandatory intake fields.');
      return;
    }

    try {
      setSubmitting(true);
      await pharmacistApi.receiveStock({
        supplier: receiveForm.supplier,
        invoiceReference: receiveForm.invoiceReference,
        notes: receiveForm.notes,
        items: [
          {
            medicineId: receiveMed.id,
            batchNumber: receiveForm.batchNumber,
            quantityReceived: Number(receiveForm.quantityReceived),
            purchaseCost: receiveForm.purchaseCost ? Number(receiveForm.purchaseCost) : null,
            sellingPrice: receiveForm.sellingPrice ? Number(receiveForm.sellingPrice) : null,
            expiryDate: receiveForm.expiryDate,
          },
        ],
      });

      if (onShowToast) {
        onShowToast(`Replenished ${receiveForm.quantityReceived} units of ${receiveMed.name}.`);
      }
      setReceiveMed(null);
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to replenish stock');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Low Stock & Reorder Alerts
            </h1>
            <Badge variant="danger">{summary.totalLowStock || 0} Alerts</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Medicines where usable inventory is below reorder thresholds or completely depleted.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Boxes}
            onClick={() => navigate('/app/pharmacist/inventory')}
          >
            Inventory Matrix
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="Total Understocked"
          value={summary.totalLowStock || 0}
          icon={AlertTriangle}
          color="amber"
          change="Requires Restock"
          changeType="warning"
        />
        <StatCard
          title="Completely Out of Stock"
          value={summary.outOfStockCount || 0}
          icon={ShieldAlert}
          color="rose"
          change="Critical Priority"
          changeType="negative"
        />
        <StatCard
          title="Critical Low (<50% Level)"
          value={summary.criticalLowCount || 0}
          icon={AlertTriangle}
          color="amber"
          change="Imminent Stockout"
          changeType="warning"
        />
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              style={{ height: '40px', minWidth: '180px' }}
            >
              <option value="ALL">All Urgency Levels</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
              <option value="CRITICAL_LOW">Critical Low (&le; 50% reorder)</option>
              <option value="LOW_STOCK">Low Stock (&le; reorder level)</option>
            </select>

            <select
              className="auth-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ height: '40px', minWidth: '160px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antidiabetic">Antidiabetic</option>
              <option value="Antihypertensive">Antihypertensive</option>
              <option value="Respiratory">Respiratory</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      {loading ? (
        <LoadingState message="Analyzing usable stock balances and calculating deficit..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : lowStockList.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            All Medicine Inventory Levels Healthy
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No medicines are currently at or below their reorder thresholds.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medicine Name & Generic</th>
                  <th>Category</th>
                  <th>Usable Stock</th>
                  <th>Reorder Level</th>
                  <th>Calculated Deficit</th>
                  <th>Urgency Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((item) => {
                  const isOut = item.urgencyLevel === 'OUT_OF_STOCK';
                  const isCritical = item.urgencyLevel === 'CRITICAL_LOW';

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.medicineCode}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {item.genericName} • {item.strength}
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isOut ? '#ef4444' : '#f59e0b' }}>
                          {item.usableStock} {item.unit}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{item.reorderLevel} {item.unit}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>
                          +{item.deficit} {item.unit} needed
                        </span>
                      </td>
                      <td>
                        <Badge variant={isOut ? 'danger' : isCritical ? 'danger' : 'warning'}>
                          {isOut ? 'OUT OF STOCK' : isCritical ? 'CRITICAL LOW' : 'LOW STOCK'}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Plus}
                            onClick={() => handleOpenRestock(item)}
                            style={{ background: '#059669', borderColor: '#047857' }}
                          >
                            Restock
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => navigate(`/app/pharmacist/medicines/${item.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Restock Intake Modal */}
      {receiveMed && (
        <Modal
          isOpen={!!receiveMed}
          onClose={() => setReceiveMed(null)}
          title={`Quick Restock — ${receiveMed.name}`}
          size="lg"
        >
          <form onSubmit={handleRestockSubmit}>
            <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(5,150,105,0.06)', borderRadius: '8px', border: '1px solid rgba(5,150,105,0.2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{receiveMed.name} ({receiveMed.medicineCode})</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Current Stock: <strong style={{ color: '#ef4444' }}>{receiveMed.usableStock} {receiveMed.unit}</strong> • Reorder Threshold: {receiveMed.reorderLevel} {receiveMed.unit} • Deficit: +{receiveMed.deficit}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <InputField
                label="Supplier *"
                value={receiveForm.supplier}
                onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                required
              />
              <InputField
                label="Invoice Reference"
                value={receiveForm.invoiceReference}
                onChange={(e) => setReceiveForm({ ...receiveForm, invoiceReference: e.target.value })}
              />
              <InputField
                label="Batch Number *"
                value={receiveForm.batchNumber}
                onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                required
              />
              <InputField
                label="Replenishment Quantity *"
                type="number"
                min="1"
                value={receiveForm.quantityReceived}
                onChange={(e) => setReceiveForm({ ...receiveForm, quantityReceived: Number(e.target.value) })}
                required
              />
              <InputField
                label="Expiry Date (YYYY-MM-DD) *"
                type="date"
                value={receiveForm.expiryDate}
                onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                required
              />
              <InputField
                label="Purchase Cost ($ per unit)"
                type="number"
                step="0.01"
                value={receiveForm.purchaseCost}
                onChange={(e) => setReceiveForm({ ...receiveForm, purchaseCost: e.target.value })}
              />
            </div>

            <InputField
              label="Notes"
              value={receiveForm.notes}
              onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setReceiveMed(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                style={{ background: '#059669', borderColor: '#047857' }}
              >
                Confirm Restock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistLowStockPage;
