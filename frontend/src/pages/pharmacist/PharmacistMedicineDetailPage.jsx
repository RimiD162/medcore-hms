import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  ArrowLeft,
  Edit,
  Layers,
  Clock,
  Boxes,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Save,
  ShieldCheck,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Tabs, Modal, InputField, SelectField, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistMedicineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const { data: medicine, loading, error, refetch } = usePharmacistData(
    () => pharmacistApi.getMedicineById(id),
    [id]
  );

  const [activeTab, setActiveTab] = useState('batches');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <LoadingState message="Loading medicine overview and batch ledger..." />;
  }

  if (error || !medicine) {
    return <ErrorState message={error || 'Medicine not found'} onRetry={refetch} />;
  }

  const handleOpenEdit = () => {
    setEditForm({
      name: medicine.name,
      genericName: medicine.genericName,
      brandName: medicine.brandName || '',
      category: medicine.category,
      manufacturer: medicine.manufacturer,
      strength: medicine.strength,
      dosageForm: medicine.dosageForm,
      route: medicine.route,
      unit: medicine.unit,
      sellingPrice: Number(medicine.sellingPrice),
      reorderLevel: medicine.reorderLevel,
      status: medicine.status,
      description: medicine.description || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await pharmacistApi.updateMedicine(medicine.id, editForm);
      if (onShowToast) {
        onShowToast('Medicine specifications updated successfully');
      }
      setShowEditModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update medicine');
      }
    } finally {
      setSaving(false);
    }
  };

  const batches = medicine.batches || [];
  const transactions = medicine.stockTransactions || [];

  return (
    <div className="med-page-container">
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/app/pharmacist/medicines')}
          >
            All Medicines
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {medicine.name}
              </h1>
              <Badge variant="primary">{medicine.medicineCode}</Badge>
              <Badge variant={medicine.status === 'Active' ? 'success' : 'secondary'}>
                {medicine.status}
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {medicine.genericName} {medicine.brandName ? `• Brand: ${medicine.brandName}` : ''} • {medicine.manufacturer}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" icon={Edit} onClick={handleOpenEdit}>
            Edit Specifications
          </Button>
          <Button
            variant="primary"
            icon={Boxes}
            onClick={() => navigate('/app/pharmacist/inventory')}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Receive Batch
          </Button>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Usable Stock
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {medicine.usableStock}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{medicine.unit}</span>
          </div>
          <Badge
            variant={medicine.stockStatus === 'In Stock' ? 'success' : medicine.stockStatus === 'Low Stock' ? 'warning' : 'danger'}
            style={{ marginTop: '6px' }}
          >
            {medicine.stockStatus}
          </Badge>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Unit Selling Price
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>
              ${Number(medicine.sellingPrice).toFixed(2)}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>/ {medicine.unit}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Hospital Formulary Rate
          </div>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Reorder Level
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {medicine.reorderLevel}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>units</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Automatic Low-Stock Trigger
          </div>
        </Card>

        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Formulation
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {medicine.strength} • {medicine.dosageForm}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Route: {medicine.route} • Category: {medicine.category}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'batches', label: `Batch Inventory (${batches.length})`, icon: Layers },
          { id: 'transactions', label: `Stock Ledger (${transactions.length})`, icon: Clock },
          { id: 'details', label: 'Clinical Specifications', icon: Pill },
        ]}
      />

      <div style={{ marginTop: '20px' }}>
        {/* Tab 1: Batch List */}
        {activeTab === 'batches' && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#059669" />
                  <span>Active & Expired Batches (FEFO Order)</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/app/pharmacist/inventory')}
                >
                  Receive New Batch
                </Button>
              </div>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="med-data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Batch Number</th>
                    <th>Expiry Date</th>
                    <th>Available Qty</th>
                    <th>Received Qty</th>
                    <th>Purchase Cost</th>
                    <th>Batch Selling Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        No batches registered for this medicine yet.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => {
                      const isExpired = new Date(b.expiryDate) < new Date();
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.batchNumber}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{new Date(b.expiryDate).toLocaleDateString()}</span>
                              {isExpired && <Badge variant="danger">Expired</Badge>}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: b.quantityAvailable > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {b.quantityAvailable} {medicine.unit}
                          </td>
                          <td>{b.quantityReceived}</td>
                          <td>{b.purchaseCost ? `$${Number(b.purchaseCost).toFixed(2)}` : '—'}</td>
                          <td style={{ fontWeight: 600, color: '#10b981' }}>
                            ${Number(b.sellingPrice || medicine.sellingPrice).toFixed(2)}
                          </td>
                          <td>
                            <Badge variant={b.status === 'Active' && !isExpired ? 'success' : 'danger'}>
                              {isExpired ? 'Expired' : b.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Stock Ledger Transactions */}
        {activeTab === 'transactions' && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#059669" />
                <span>Audit Trail & Ledger Mutations for this Medicine</span>
              </div>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="med-data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Tx Number</th>
                    <th>Date & Time</th>
                    <th>Batch</th>
                    <th>Type</th>
                    <th>Quantity Change</th>
                    <th>Balance After</th>
                    <th>Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        No transactions recorded for this medicine.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = tx.quantityChange > 0;
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontWeight: 600 }}>{tx.transactionNumber}</td>
                          <td>{new Date(tx.createdAt).toLocaleString()}</td>
                          <td>{tx.batch?.batchNumber || '—'}</td>
                          <td>
                            <Badge
                              variant={
                                tx.type === 'RECEIPT'
                                  ? 'success'
                                  : tx.type === 'DISPENSE'
                                  ? 'primary'
                                  : tx.type === 'EXPIRY_WRITE_OFF'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {tx.type}
                            </Badge>
                          </td>
                          <td style={{ fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444' }}>
                            {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.balanceAfter}</td>
                          <td>{tx.performedBy?.fullName || 'System'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Clinical Specs */}
        {activeTab === 'details' && (
          <Card title="Clinical & Formulary Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Ingredients
                </span>
                <p style={{ margin: '4px 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {medicine.genericName}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Dosage Form & Strength
                </span>
                <p style={{ margin: '4px 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {medicine.strength} {medicine.dosageForm} ({medicine.route} Route)
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Primary Manufacturer
                </span>
                <p style={{ margin: '4px 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {medicine.manufacturer}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Packaging & Dispensing Unit
                </span>
                <p style={{ margin: '4px 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {medicine.unit}
                </p>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Clinical Guidelines / Storage Notes
                </span>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {medicine.description || 'No specialized clinical storage or handling notes provided.'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Specifications Modal */}
      {showEditModal && editForm && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit ${medicine.name} Specifications`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <InputField
                label="Medicine Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
              <InputField
                label="Generic Name"
                value={editForm.genericName}
                onChange={(e) => setEditForm({ ...editForm, genericName: e.target.value })}
                required
              />
              <InputField
                label="Brand Name"
                value={editForm.brandName}
                onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
              />
              <InputField
                label="Manufacturer"
                value={editForm.manufacturer}
                onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                required
              />
              <InputField
                label="Selling Price ($ per unit)"
                type="number"
                step="0.01"
                min="0.01"
                value={editForm.sellingPrice}
                onChange={(e) => setEditForm({ ...editForm, sellingPrice: Number(e.target.value) })}
                required
              />
              <InputField
                label="Reorder Level (units)"
                type="number"
                min="0"
                value={editForm.reorderLevel}
                onChange={(e) => setEditForm({ ...editForm, reorderLevel: Number(e.target.value) })}
                required
              />
              <SelectField
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            <TextareaField
              label="Description / Storage Guidelines"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={saving}
                style={{ background: '#059669', borderColor: '#047857' }}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistMedicineDetailPage;
