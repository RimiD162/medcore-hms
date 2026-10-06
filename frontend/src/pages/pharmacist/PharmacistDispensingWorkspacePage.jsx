import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  User,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Printer,
  Receipt,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Modal, ConfirmationDialog, InputField, SelectField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistDispensingWorkspacePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const initialRxId = searchParams.get('rxId') || '';
  const [selectedRxId, setSelectedRxId] = useState(initialRxId);

  // Load prescription queue for selector
  const { data: queueData, loading: queueLoading } = usePharmacistData(
    () => pharmacistApi.getPrescriptions({ status: 'ACTIVE', limit: 50 })
  );
  const queuePrescriptions = queueData?.prescriptions || [];

  // Load selected prescription details
  const {
    data: prescription,
    loading: rxLoading,
    error: rxError,
    refetch: refetchRx,
  } = usePharmacistData(
    () => (selectedRxId ? pharmacistApi.getPrescriptionDetail(selectedRxId) : Promise.resolve(null)),
    [selectedRxId],
    !!selectedRxId
  );

  // Dispensing items state
  // key: itemId -> { batchId, quantity, overrideReason }
  const [dispenseItems, setDispenseItems] = useState({});
  const [dispensingNotes, setDispensingNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Post-dispense slip modal state
  const [completedDispense, setCompletedDispense] = useState(null);

  // Initialize FEFO batch selections whenever prescription data loads
  useEffect(() => {
    if (prescription?.items) {
      const initialMap = {};
      prescription.items.forEach((item) => {
        const remainingQty = (item.quantityPrescribed || 0) - (item.quantityDispensed || 0);
        const batches = item.eligibleBatches || [];
        const fefoBatch = batches.length > 0 ? batches[0] : null;

        if (remainingQty > 0 && fefoBatch) {
          initialMap[item.id] = {
            prescriptionItemId: item.id,
            medicineId: item.medicineId,
            batchId: fefoBatch.id,
            quantity: Math.min(remainingQty, fefoBatch.quantityAvailable),
            overrideReason: '',
          };
        }
      });
      setDispenseItems(initialMap);
    }
  }, [prescription]);

  const handleBatchChange = (itemId, batchId, item) => {
    const batches = item.eligibleBatches || [];
    const chosenBatch = batches.find((b) => b.id === batchId);
    const fefoBatch = batches[0];
    const isOverride = chosenBatch && fefoBatch && chosenBatch.id !== fefoBatch.id;

    setDispenseItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        batchId,
        overrideReason: isOverride ? prev[itemId]?.overrideReason || 'Pharmacist clinical stock rotation override' : '',
      },
    }));
  };

  const handleQtyChange = (itemId, qty, maxQty) => {
    const parsed = qty === '' ? '' : Math.max(1, Math.min(Number(qty), maxQty));
    setDispenseItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: parsed,
      },
    }));
  };

  // Calculate estimated totals
  let estimatedTotal = 0;
  const itemsToDispense = [];

  if (prescription?.items) {
    prescription.items.forEach((item) => {
      const form = dispenseItems[item.id];
      if (form && form.quantity > 0 && form.batchId) {
        const batch = item.eligibleBatches?.find((b) => b.id === form.batchId);
        const unitPrice = Number(batch?.sellingPrice || item.medicine?.sellingPrice || 0);
        const lineTotal = unitPrice * Number(form.quantity);
        estimatedTotal += lineTotal;

        itemsToDispense.push({
          prescriptionItemId: item.id,
          medicineId: item.medicineId,
          batchId: form.batchId,
          batchNumber: batch?.batchNumber || '—',
          medicineName: item.medicineName,
          quantity: Number(form.quantity),
          unitPrice,
          lineTotal,
          overrideReason: form.overrideReason || null,
        });
      }
    });
  }

  const handleExecuteDispense = async () => {
    if (itemsToDispense.length === 0) {
      if (onShowToast) onShowToast('Please configure at least one item with valid quantity to dispense.');
      return;
    }

    try {
      setSubmitting(true);
      const idempotencyKey = `dsp-${prescription.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const response = await pharmacistApi.dispense({
        prescriptionId: prescription.id,
        idempotencyKey,
        notes: dispensingNotes || undefined,
        items: itemsToDispense.map((i) => ({
          prescriptionItemId: i.prescriptionItemId,
          medicineId: i.medicineId,
          batchId: i.batchId,
          quantity: i.quantity,
          overrideReason: i.overrideReason || undefined,
        })),
      });

      setShowConfirmDialog(false);
      const resultData = response.data || response;
      setCompletedDispense({
        dispensing: resultData.dispensing,
        prescription: prescription,
        invoice: resultData.invoice,
        items: itemsToDispense,
        totalAmount: estimatedTotal,
      });

      if (onShowToast) {
        onShowToast(`Dispensed ${itemsToDispense.length} items. Billed $${estimatedTotal.toFixed(2)} to patient invoice.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Dispensing failed. Check batch stock balances.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dispensing Terminal & Verification Workspace
            </h1>
            <Badge variant="success">Atomic FEFO Allocation</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Dispense verified medications, deduct batch inventory atomically, and link pharmacy charges to shared patient billing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Receipt}
            onClick={() => navigate('/app/pharmacist/dispensing/history')}
          >
            Dispense History
          </Button>
        </div>
      </div>

      {/* Prescription Selector Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select Prescription Order from Queue:
            </label>
            <select
              className="auth-input"
              value={selectedRxId}
              onChange={(e) => {
                setSelectedRxId(e.target.value);
                navigate(`/app/pharmacist/dispensing?rxId=${e.target.value}`, { replace: true });
              }}
              style={{ width: '100%', height: '42px' }}
            >
              <option value="">Choose a pending prescription...</option>
              {queuePrescriptions.map((rx) => (
                <option key={rx.id} value={rx.id}>
                  {rx.prescriptionNumber} — {rx.patient?.fullName} ({rx.patient?.patientIdNumber}) [Status: {rx.dispensingStatus}]
                </option>
              ))}
            </select>
          </div>

          {selectedRxId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/pharmacist/prescriptions/${selectedRxId}`)}
              style={{ height: '42px', marginTop: 'auto' }}
            >
              Review Item Mappings &rarr;
            </Button>
          )}
        </div>
      </Card>

      {!selectedRxId ? (
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ClipboardCheck size={54} color="#059669" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Select a Prescription to Begin Dispensing
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: '0.9rem' }}>
            Choose an active order from the dropdown above or pick from the prescription queue.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/app/pharmacist/prescriptions')}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Go to Prescription Queue
          </Button>
        </Card>
      ) : rxLoading ? (
        <LoadingState message="Loading prescription items and computing FEFO batch allocations..." />
      ) : rxError || !prescription ? (
        <ErrorState message={rxError || 'Prescription not found'} onRetry={refetchRx} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Main Item Dispensing Columns */}
          <div style={{ gridColumn: 'span 2' }}>
            {/* Patient Demographic & Allergy Alert Header */}
            <Card style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {prescription.patient?.fullName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ID: {prescription.patient?.patientIdNumber} • Age: {prescription.patient?.age} • Gender: {prescription.patient?.gender}
                    </div>
                  </div>
                </div>

                {prescription.patient?.allergies && prescription.patient.allergies.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <Badge variant="danger">
                      Allergies: {prescription.patient.allergies.join(', ')}
                    </Badge>
                  </div>
                ) : (
                  <div style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> No Known Drug Allergies
                  </div>
                )}
              </div>
            </Card>

            {/* Prescribed Items & Batch Allocator */}
            <Card title="Prescribed Medications & Batch Allocation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {prescription.items?.map((item, idx) => {
                  const remainingQty = (item.quantityPrescribed || 0) - (item.quantityDispensed || 0);
                  const isFulfilled = remainingQty <= 0;
                  const form = dispenseItems[item.id] || {};
                  const batches = item.eligibleBatches || [];
                  const selectedBatch = batches.find((b) => b.id === form.batchId);
                  const fefoBatch = batches[0];
                  const isOverride = selectedBatch && fefoBatch && selectedBatch.id !== fefoBatch.id;

                  if (!item.medicineId) {
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <strong>{item.medicineName}</strong> ({item.dosage}, {item.frequency})
                          <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                            Formulary mapping required before this item can be dispensed.
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/pharmacist/prescriptions/${prescription.id}`)}
                        >
                          Map Medicine
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: isFulfilled ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                        border: isFulfilled ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                      }}
                    >
                      {/* Header Line */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {item.medicine?.name || item.medicineName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.dosage} • {item.frequency} • {item.duration} • Total Prescribed: {item.quantityPrescribed || '—'} {item.medicine?.unit || 'units'}
                          </div>
                        </div>

                        <div>
                          {isFulfilled ? (
                            <Badge variant="success">Fully Dispensed ({item.quantityDispensed})</Badge>
                          ) : (
                            <Badge variant="warning">
                              Remaining: {remainingQty} {item.medicine?.unit || 'units'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Batch & Quantity Selector */}
                      {!isFulfilled && (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                            {/* Batch Selection */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  FEFO Batch Allocation:
                                </label>
                                {fefoBatch && (
                                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                                    Earliest Exp: {new Date(fefoBatch.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {batches.length === 0 ? (
                                <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, padding: '8px 0' }}>
                                  No active non-expired stock available for this medicine.
                                </div>
                              ) : (
                                <select
                                  className="auth-input"
                                  value={form.batchId || ''}
                                  onChange={(e) => handleBatchChange(item.id, e.target.value, item)}
                                  style={{ width: '100%', height: '40px' }}
                                >
                                  {batches.map((b, bIdx) => (
                                    <option key={b.id} value={b.id}>
                                      {b.batchNumber} (Avail: {b.quantityAvailable}, Exp: {new Date(b.expiryDate).toLocaleDateString()}) {bIdx === 0 ? '★ FEFO' : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Quantity to Dispense */}
                            <div>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                Dispense Quantity ({item.medicine?.unit || 'units'}):
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={Math.min(remainingQty, selectedBatch?.quantityAvailable || 1)}
                                className="auth-input"
                                value={form.quantity || ''}
                                onChange={(e) => handleQtyChange(item.id, e.target.value, Math.min(remainingQty, selectedBatch?.quantityAvailable || 1))}
                                style={{ width: '100%', height: '40px' }}
                              />
                            </div>

                            {/* Price Snapshot Calculation */}
                            <div>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                Item Charge (Server Snapshot):
                              </label>
                              <div style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>
                                  ${((Number(selectedBatch?.sellingPrice || item.medicine?.sellingPrice || 0)) * (Number(form.quantity) || 0)).toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  (${Number(selectedBatch?.sellingPrice || item.medicine?.sellingPrice || 0).toFixed(2)} / unit)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Override Reason Field if not FEFO */}
                          {isOverride && (
                            <div style={{ marginTop: '10px' }}>
                              <InputField
                                label="FEFO Batch Override Reason *"
                                placeholder="Clinical reason for overriding FEFO earliest expiry batch..."
                                value={form.overrideReason || ''}
                                onChange={(e) =>
                                  setDispenseItems((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], overrideReason: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Summary Sidebar */}
          <div>
            <Card title="Dispensing & Billing Summary" style={{ position: 'sticky', top: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Prescription Number:</span>
                  <span style={{ fontWeight: 600 }}>{prescription.prescriptionNumber}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items Configured:</span>
                  <span style={{ fontWeight: 600 }}>{itemsToDispense.length} Lines</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dispensing Pharmacist:</span>
                  <span style={{ fontWeight: 600 }}>Marcus Vance, RPh</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Total Pharmacy Charge:
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#10b981' }}>
                    ${estimatedTotal.toFixed(2)}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(5,150,105,0.06)', padding: '10px', borderRadius: '6px' }}>
                  Charges will be automatically appended as <strong style={{ color: 'var(--text-primary)' }}>Pharmacy</strong> line items to the patient's open hospital invoice.
                </div>

                <InputField
                  label="Dispensing Notes"
                  placeholder="Patient counseling notes, administration warnings..."
                  value={dispensingNotes}
                  onChange={(e) => setDispensingNotes(e.target.value)}
                />

                <Button
                  variant="primary"
                  icon={ShieldCheck}
                  disabled={itemsToDispense.length === 0 || prescription.onHold}
                  onClick={() => setShowConfirmDialog(true)}
                  style={{ width: '100%', height: '44px', background: '#059669', borderColor: '#047857', marginTop: '8px' }}
                >
                  Verify & Execute Dispense
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleExecuteDispense}
        title="Confirm Prescription Dispensing"
        message={`You are about to dispense ${itemsToDispense.length} items totaling $${estimatedTotal.toFixed(2)} for ${prescription?.patient?.fullName}. Batch stock will be deducted immediately and an invoice line item will be recorded.`}
        confirmText="Confirm & Deduct Stock"
        variant="primary"
      />

      {/* Post-Dispense Printable Receipt Slip Modal */}
      {completedDispense && (
        <Modal
          isOpen={!!completedDispense}
          onClose={() => {
            setCompletedDispense(null);
            refetchRx();
          }}
          title="Dispensing Completed — Pharmacy Slip"
          size="lg"
        >
          <div id="printable-dispense-slip" style={{ padding: '8px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: '14px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                MedCore HMS — Central Dispensary
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Official Pharmacy Dispensing Receipt & Patient Counseling Slip
              </div>
            </div>

            {/* Meta Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              <div>
                <strong>Dispensing Number:</strong> {completedDispense.dispensing?.dispensingNumber}
              </div>
              <div>
                <strong>Prescription Number:</strong> {completedDispense.prescription?.prescriptionNumber}
              </div>
              <div>
                <strong>Patient:</strong> {completedDispense.prescription?.patient?.fullName} ({completedDispense.prescription?.patient?.patientIdNumber})
              </div>
              <div>
                <strong>Pharmacist:</strong> Marcus Vance, RPh (License: RPH-2024-8849)
              </div>
              <div>
                <strong>Date & Time:</strong> {new Date().toLocaleString()}
              </div>
              <div>
                <strong>Invoice Reference:</strong> {completedDispense.invoice?.invoiceNumber || 'Linked to Open Invoice'}
              </div>
            </div>

            {/* Dispensed Items Table */}
            <table className="med-data-table" style={{ width: '100%', marginBottom: '16px', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedDispense.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.medicineName}</td>
                    <td>{i.batchNumber}</td>
                    <td>{i.quantity}</td>
                    <td>${i.unitPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${i.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>Total Billed Charge:</td>
                  <td style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                    ${completedDispense.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
              Keep all medications out of reach of children. Follow prescribed dosage instructions strictly.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button
              variant="outline"
              icon={Printer}
              onClick={handlePrintSlip}
            >
              Print Dispensing Slip
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setCompletedDispense(null);
                refetchRx();
              }}
              style={{ background: '#059669', borderColor: '#047857' }}
            >
              Done / Return to Queue
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistDispensingWorkspacePage;
