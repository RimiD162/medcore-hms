import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Boxes,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  FilePlus,
  DollarSign,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Modal, InputField, SelectField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistInventoryPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [expandedMeds, setExpandedMeds] = useState({});

  // Receive Stock Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    supplier: '',
    invoiceReference: '',
    notes: '',
    items: [
      {
        medicineId: '',
        batchNumber: '',
        quantityReceived: 100,
        purchaseCost: '',
        sellingPrice: '',
        expiryDate: '',
      },
    ],
  });
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getInventory({
        search: search || undefined,
        category: category !== 'ALL' ? category : undefined,
        status: status !== 'ALL' ? status : undefined,
        limit: 50,
      }),
    [search, category, status]
  );

  // Load medicines list for receive stock dropdown
  const { data: medListData } = usePharmacistData(() => pharmacistApi.getMedicines({ limit: 100 }));
  const catalogMedicines = medListData?.medicines || [];

  const inventory = data?.inventory || [];

  const toggleExpand = (medId) => {
    setExpandedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleOpenReceiveModal = (preselectedMedId = '') => {
    setReceiveForm({
      supplier: 'MedCore Central Pharma Distributors',
      invoiceReference: `INV-${Date.now().toString().slice(-6)}`,
      notes: 'Standard stock intake verified by pharmacist',
      items: [
        {
          medicineId: preselectedMedId || (catalogMedicines[0]?.id || ''),
          batchNumber: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
          quantityReceived: 100,
          purchaseCost: 3.50,
          sellingPrice: '',
          expiryDate: '2027-12-31',
        },
      ],
    });
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    const item = receiveForm.items[0];
    if (!item.medicineId || !item.batchNumber.trim() || !item.expiryDate || item.quantityReceived <= 0) {
      if (onShowToast) onShowToast('Please fill all mandatory goods receipt fields.');
      return;
    }

    try {
      setSubmittingReceipt(true);
      await pharmacistApi.receiveStock(receiveForm);
      if (onShowToast) {
        onShowToast(`Stock received successfully. Batch ${item.batchNumber} updated.`);
      }
      setShowReceiveModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to receive stock');
      }
    } finally {
      setSubmittingReceipt(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Inventory & Batch Matrix
            </h1>
            <Badge variant="primary">Batch-Level Tracking</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Expand medicines to inspect active batches, expiry countdowns, purchase costs, and stock status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Layers}
            onClick={() => navigate('/app/pharmacist/batches')}
          >
            All Batches
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenReceiveModal()}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Receive Goods Stock
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="auth-input"
              placeholder="Filter by medicine, active batch number, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ height: '40px', minWidth: '150px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antidiabetic">Antidiabetic</option>
              <option value="Antihypertensive">Antihypertensive</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </select>

            <select
              className="auth-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: '40px', minWidth: '130px' }}
            >
              <option value="ALL">All Stock Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Inventory Tree View */}
      {loading ? (
        <LoadingState message="Loading inventory matrix and active batch allocations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : inventory.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Boxes size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Inventory Records
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', fontSize: '0.9rem' }}>
            No medicines match the inventory search criteria.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {inventory.map((med) => {
            const isExpanded = expandedMeds[med.id];
            const activeBatches = med.activeBatches || [];
            const expiredBatches = med.expiredBatches || [];

            return (
              <Card key={med.id} style={{ padding: '0', overflow: 'hidden' }}>
                {/* Header Row */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    background: isExpanded ? 'rgba(5, 150, 105, 0.04)' : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleExpand(med.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {med.name}
                        </span>
                        <Badge variant="primary">{med.medicineCode}</Badge>
                        <Badge variant="outline">{med.category}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {med.genericName} • {med.strength} ({med.dosageForm}) • Reorder Threshold: {med.reorderLevel} {med.unit}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {med.usableStock} {med.unit}
                        </span>
                        <Badge
                          variant={
                            med.stockStatus === 'In Stock'
                              ? 'success'
                              : med.stockStatus === 'Low Stock'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {med.stockStatus}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {activeBatches.length} Active Batch{activeBatches.length !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReceiveModal(med.id)}
                      >
                        + Receive
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/pharmacist/medicines/${med.id}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Batches Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(0, 0, 0, 0.15)',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Active & Available Batches (FEFO Dispensing Priority)
                    </div>

                    {activeBatches.length === 0 ? (
                      <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No active non-expired batches with stock available for this medicine.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="med-data-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Batch Number</th>
                              <th>Expiry Date</th>
                              <th>Days to Expiry</th>
                              <th>Available Quantity</th>
                              <th>Unit Price</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeBatches.map((b) => {
                              const days = b.daysUntilExpiry;
                              return (
                                <tr key={b.id}>
                                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.batchNumber}</td>
                                  <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                                  <td>
                                    <Badge
                                      variant={
                                        days <= 30
                                          ? 'danger'
                                          : days <= 60
                                          ? 'warning'
                                          : 'success'
                                      }
                                    >
                                      {days} days remaining
                                    </Badge>
                                  </td>
                                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {b.quantityAvailable} {med.unit}
                                  </td>
                                  <td style={{ fontWeight: 600, color: '#10b981' }}>
                                    ${Number(b.sellingPrice || med.sellingPrice).toFixed(2)}
                                  </td>
                                  <td>
                                    <Badge variant="success">Active</Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate('/app/pharmacist/batches')}
                                    >
                                      Manage
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <Modal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          title="Receive Stock (Goods Receipt Intake)"
          size="lg"
        >
          <form onSubmit={handleReceiveSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <InputField
                label="Supplier / Distributor *"
                value={receiveForm.supplier}
                onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                placeholder="e.g. Apollo MedSource, Pfizer Direct"
                required
              />
              <InputField
                label="Vendor Invoice Reference"
                value={receiveForm.invoiceReference}
                onChange={(e) => setReceiveForm({ ...receiveForm, invoiceReference: e.target.value })}
                placeholder="e.g. INV-2026-9921"
              />
            </div>

            <Card title="Medicine & Batch Details" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <SelectField
                  label="Select Medicine *"
                  value={receiveForm.items[0]?.medicineId}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].medicineId = e.target.value;
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  options={catalogMedicines.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.medicineCode})`,
                  }))}
                  required
                />
                <InputField
                  label="Batch Number *"
                  value={receiveForm.items[0]?.batchNumber}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].batchNumber = e.target.value;
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  placeholder="e.g. BAT-2026-099"
                  required
                />
                <InputField
                  label="Quantity Received *"
                  type="number"
                  min="1"
                  value={receiveForm.items[0]?.quantityReceived}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].quantityReceived = Number(e.target.value);
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  required
                />
                <InputField
                  label="Expiry Date (YYYY-MM-DD) *"
                  type="date"
                  value={receiveForm.items[0]?.expiryDate}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].expiryDate = e.target.value;
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  required
                />
                <InputField
                  label="Purchase Cost ($ per unit)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receiveForm.items[0]?.purchaseCost}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].purchaseCost = e.target.value === '' ? '' : Number(e.target.value);
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  placeholder="e.g. 2.50"
                />
                <InputField
                  label="Selling Price ($ per unit)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={receiveForm.items[0]?.sellingPrice}
                  onChange={(e) => {
                    const newItems = [...receiveForm.items];
                    newItems[0].sellingPrice = e.target.value === '' ? '' : Number(e.target.value);
                    setReceiveForm({ ...receiveForm, items: newItems });
                  }}
                  placeholder="Defaults to catalog price"
                />
              </div>
            </Card>

            <InputField
              label="Intake Notes"
              value={receiveForm.notes}
              onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              placeholder="Cold chain packaging verified, batch integrity checked..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setShowReceiveModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submittingReceipt}
                style={{ background: '#059669', borderColor: '#047857' }}
              >
                Confirm & Record Intake
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistInventoryPage;
