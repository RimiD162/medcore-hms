import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  User,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Save,
  PauseCircle,
  PlayCircle,
  Boxes,
  Sparkles,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Modal, SelectField, InputField, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistPrescriptionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const { data: prescription, loading, error, refetch } = usePharmacistData(
    () => pharmacistApi.getPrescriptionDetail(id),
    [id]
  );

  // Load catalog medicines for dropdown mapping
  const { data: medData } = usePharmacistData(() => pharmacistApi.getMedicines({ limit: 100 }));
  const catalogMedicines = medData?.medicines || [];

  // Local mapping state per item
  const [mappingState, setMappingState] = useState({});
  const [savingItemId, setSavingItemId] = useState(null);

  // Hold / Release Modal State
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [submittingHold, setSubmittingHold] = useState(false);

  if (loading) {
    return <LoadingState message="Loading prescription clinical safeguards and inventory mapping..." />;
  }

  if (error || !prescription) {
    return <ErrorState message={error || 'Prescription not found'} onRetry={refetch} />;
  }

  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const items = prescription.items || [];
  const dispensings = prescription.dispensings || [];

  const handleSelectMed = (itemId, medicineId) => {
    setMappingState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        medicineId,
      },
    }));
  };

  const handleQuantityChange = (itemId, qty) => {
    setMappingState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantityPrescribed: qty === '' ? '' : Number(qty),
      },
    }));
  };

  const handleApplySuggestion = (itemId, suggestedQty) => {
    setMappingState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantityPrescribed: suggestedQty,
      },
    }));
  };

  const handleSaveMapping = async (item) => {
    const local = mappingState[item.id] || {};
    const medIdToSave = local.medicineId || item.medicineId;
    const qtyToSave = local.quantityPrescribed !== undefined ? local.quantityPrescribed : item.quantityPrescribed;

    if (!medIdToSave) {
      if (onShowToast) onShowToast('Please select a catalog medicine to map this item.');
      return;
    }

    try {
      setSavingItemId(item.id);
      await pharmacistApi.mapPrescriptionItem(prescription.id, item.id, {
        medicineId: medIdToSave,
        quantityPrescribed: qtyToSave ? Number(qtyToSave) : undefined,
      });
      if (onShowToast) {
        onShowToast(`Mapped item "${item.medicineName}" to catalog.`);
      }
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to map item');
      }
    } finally {
      setSavingItemId(null);
    }
  };

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    if (!holdReason.trim() || holdReason.trim().length < 3) {
      if (onShowToast) onShowToast('Please provide a mandatory reason for placing prescription on hold.');
      return;
    }

    try {
      setSubmittingHold(true);
      await pharmacistApi.holdPrescription(prescription.id, { reason: holdReason.trim() });
      if (onShowToast) {
        onShowToast('Prescription placed on hold. Prescribing physician notified.');
      }
      setShowHoldModal(false);
      setHoldReason('');
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to place prescription on hold');
      }
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleRelease = async () => {
    try {
      await pharmacistApi.releasePrescription(prescription.id);
      if (onShowToast) {
        onShowToast('Prescription released from hold back to dispensing queue.');
      }
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to release prescription');
      }
    }
  };

  const allItemsMapped = items.every((i) => i.medicineId);

  return (
    <div className="med-page-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/app/pharmacist/prescriptions')}
          >
            Queue
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Prescription {prescription.prescriptionNumber}
              </h1>
              {prescription.onHold ? (
                <Badge variant="danger">ON HOLD</Badge>
              ) : (
                <Badge
                  variant={
                    prescription.dispensingStatus === 'DISPENSED'
                      ? 'success'
                      : prescription.dispensingStatus === 'PARTIALLY_DISPENSED'
                      ? 'warning'
                      : 'primary'
                  }
                >
                  {prescription.dispensingStatus}
                </Badge>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Prescribed Date: {new Date(prescription.prescribedDate).toLocaleDateString()} • Doctor: Dr. {doctor.user?.fullName} ({doctor.department})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {prescription.onHold ? (
            <Button
              variant="outline"
              icon={PlayCircle}
              onClick={handleRelease}
              style={{ color: '#10b981', borderColor: '#10b981' }}
            >
              Release from Hold
            </Button>
          ) : (
            <Button
              variant="outline"
              icon={PauseCircle}
              onClick={() => setShowHoldModal(true)}
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
            >
              Place on Hold
            </Button>
          )}

          <Button
            variant="primary"
            disabled={prescription.onHold || !allItemsMapped || prescription.dispensingStatus === 'DISPENSED'}
            onClick={() => navigate(`/app/pharmacist/dispensing?rxId=${prescription.id}`)}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Proceed to Dispense
          </Button>
        </div>
      </div>

      {/* On Hold Warning Banner */}
      {prescription.onHold && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
              Prescription is Currently On Hold
            </strong>
            <p style={{ margin: '0 0 6px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Reason: "{prescription.holdReason}"
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Placed on hold by {prescription.heldBy?.fullName || 'Pharmacy'} on {prescription.heldAt ? new Date(prescription.heldAt).toLocaleString() : 'N/A'}. Dispensing is locked until released.
            </span>
          </div>
        </div>
      )}

      {/* Patient Demographic & Allergy Safeguard Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
              <User size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {patient.fullName}
                </span>
                <Badge variant="outline">{patient.patientIdNumber}</Badge>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Age: {patient.age} yrs • Gender: {patient.gender} • Phone: {patient.phone || 'N/A'}
              </div>
            </div>
          </div>

          {/* Prominent Allergy Safeguard Pill */}
          {patient.allergies && patient.allergies.length > 0 ? (
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} color="#ef4444" />
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#ef4444' }}>
                  Known Drug Allergies
                </div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                  {patient.allergies.join(', ')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>No Known Drug Allergies Recorded</span>
            </div>
          )}
        </div>
      </Card>

      {/* Items Review & Mapping Matrix */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={18} color="#059669" />
              <span>Prescription Items & Formulary Mapping</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {items.length} Item{items.length !== 1 ? 's' : ''} Prescribed
            </span>
          </div>
        }
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {items.map((item, idx) => {
            const local = mappingState[item.id] || {};
            const selectedMedId = local.medicineId || item.medicineId || '';
            const qtyValue = local.quantityPrescribed !== undefined ? local.quantityPrescribed : (item.quantityPrescribed || '');

            return (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Doctor's Prescribed Instruction Line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Item #{idx + 1} Prescribed by Doctor:
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {item.medicineName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Dosage: <strong>{item.dosage}</strong> • Frequency: <strong>{item.frequency}</strong> • Duration: <strong>{item.duration}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dispensing Progress</div>
                    <div style={{ fontWeight: 700, color: item.quantityDispensed >= item.quantityPrescribed ? '#10b981' : 'var(--text-primary)' }}>
                      {item.quantityDispensed} / {item.quantityPrescribed || '—'} units dispensed
                    </div>
                  </div>
                </div>

                {/* Mapping Controls Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                  {/* Select Catalog Medicine */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Map to Formulary Medicine *
                    </label>
                    <select
                      className="auth-input"
                      value={selectedMedId}
                      onChange={(e) => handleSelectMed(item.id, e.target.value)}
                      style={{ width: '100%', height: '40px' }}
                    >
                      <option value="">Select Catalog Medicine...</option>
                      {catalogMedicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.strength}, {m.unit}) — Stock: {m.usableStock}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Confirmed Prescribed Quantity */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Confirm Prescribed Qty *
                      </label>
                      {item.suggestedQuantity && (
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(item.id, item.suggestedQuantity)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Sparkles size={11} /> Suggest: {item.suggestedQuantity}
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="auth-input"
                      value={qtyValue}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      placeholder="Total units prescribed"
                      style={{ width: '100%', height: '40px' }}
                    />
                  </div>

                  {/* Available Batches / Stock Status Pill */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Inventory Stock Status
                    </label>
                    <div style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: item.availableStock > 0 ? '#10b981' : '#ef4444' }}>
                        {item.availableStock} units available
                      </span>
                      <Badge variant={item.isStockSufficient ? 'success' : 'danger'}>
                        {item.isStockSufficient ? 'Stock OK' : 'Low / Out'}
                      </Badge>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div>
                    <Button
                      variant="primary"
                      icon={Save}
                      loading={savingItemId === item.id}
                      onClick={() => handleSaveMapping(item)}
                      style={{ height: '40px', width: '100%', background: '#059669', borderColor: '#047857' }}
                    >
                      Save Mapping
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Previous Dispensing History for this Prescription */}
      {dispensings.length > 0 && (
        <Card title="Previous Dispensing Records for this Prescription">
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Dispensing Number</th>
                  <th>Date & Time</th>
                  <th>Pharmacist</th>
                  <th>Items Dispensed</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dispensings.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.dispensingNumber}</td>
                    <td>{new Date(d.createdAt).toLocaleString()}</td>
                    <td>{d.pharmacist?.fullName || 'Pharmacist'}</td>
                    <td>{d.items?.length || 0} line items</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>${Number(d.totalAmount).toFixed(2)}</td>
                    <td><Badge variant="success">{d.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <Modal
          isOpen={showHoldModal}
          onClose={() => setShowHoldModal(false)}
          title={`Place Prescription ${prescription.prescriptionNumber} On Hold`}
        >
          <form onSubmit={handleHoldSubmit}>
            <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                Prescription Hold Safeguard
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Placing this order on hold locks dispensing and sends an urgent notification to prescribing physician <strong>Dr. {doctor.user?.fullName}</strong>.
              </p>
            </div>

            <TextareaField
              label="Mandatory Clinical / Operational Reason *"
              placeholder="e.g. Unclear dosage frequency, potential interaction with patient allergy, catalog stock unavailable..."
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              rows={3}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setShowHoldModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={submittingHold}
              >
                Confirm Hold
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistPrescriptionDetailPage;
