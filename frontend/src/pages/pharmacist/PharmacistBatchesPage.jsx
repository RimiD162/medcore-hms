import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  PackageCheck,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  CalendarClock,
  Save,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Modal, InputField, SelectField, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistBatchesPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [search, setSearch] = useState('');
  const [expiryBucket, setExpiryBucket] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Adjustment Modal State
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Write Off Modal State
  const [writeOffBatch, setWriteOffBatch] = useState(null);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [submittingWriteOff, setSubmittingWriteOff] = useState(false);

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getBatches({
        search: search || undefined,
        expiryBucket: expiryBucket !== 'ALL' ? expiryBucket : undefined,
        status: status !== 'ALL' ? status : undefined,
        limit: 50,
      }),
    [search, expiryBucket, status]
  );

  const batches = data?.batches || [];
  const total = data?.pagination?.total || 0;

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustBatch || adjustQty === '' || Number(adjustQty) === 0 || !adjustReason.trim()) {
      if (onShowToast) onShowToast('Please provide a non-zero quantity change and mandatory clinical reason.');
      return;
    }

    try {
      setSubmittingAdjust(true);
      await pharmacistApi.adjustStock({
        batchId: adjustBatch.id,
        quantityChange: Number(adjustQty),
        reason: adjustReason.trim(),
      });
      if (onShowToast) {
        onShowToast(`Stock adjusted by ${adjustQty} units for batch ${adjustBatch.batchNumber}`);
      }
      setAdjustBatch(null);
      setAdjustQty('');
      setAdjustReason('');
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to adjust stock');
      }
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleWriteOffSubmit = async (e) => {
    e.preventDefault();
    if (!writeOffBatch || !writeOffReason.trim()) {
      if (onShowToast) onShowToast('Please provide a mandatory reason for batch write-off.');
      return;
    }

    try {
      setSubmittingWriteOff(true);
      await pharmacistApi.writeOffExpired({
        batchId: writeOffBatch.id,
        reason: writeOffReason.trim(),
      });
      if (onShowToast) {
        onShowToast(`Wrote off batch ${writeOffBatch.batchNumber}. Remaining stock zeroed.`);
      }
      setWriteOffBatch(null);
      setWriteOffReason('');
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to write off batch');
      }
    } finally {
      setSubmittingWriteOff(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Batch Inventory Ledger
            </h1>
            <Badge variant="primary">{total} Batches</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track batch-level expiration timelines, perform authorized quantity adjustments, and write off expired units.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={CalendarClock}
            onClick={() => navigate('/app/pharmacist/expiry')}
          >
            Expiry Risk View
          </Button>
          <Button
            variant="primary"
            icon={PackageCheck}
            onClick={() => navigate('/app/pharmacist/inventory')}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Stock Overview
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
              placeholder="Search by batch number or medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={expiryBucket}
              onChange={(e) => setExpiryBucket(e.target.value)}
              style={{ height: '40px', minWidth: '160px' }}
            >
              <option value="ALL">All Expiry Windows</option>
              <option value="30_DAYS">Expiring in 30 Days</option>
              <option value="60_DAYS">Expiring in 60 Days</option>
              <option value="90_DAYS">Expiring in 90 Days</option>
              <option value="EXPIRED">Already Expired</option>
            </select>

            <select
              className="auth-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: '40px', minWidth: '130px' }}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="WrittenOff">WrittenOff</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Batches Table */}
      {loading ? (
        <LoadingState message="Loading batch inventory ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : batches.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <PackageCheck size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Batches Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No batches match the filter criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Medicine</th>
                  <th>Expiry Date</th>
                  <th>Timeline Status</th>
                  <th>Available Quantity</th>
                  <th>Purchase Cost</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const days = b.daysUntilExpiry;
                  const isExpired = days < 0 || b.status === 'Expired';

                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.batchNumber}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.medicine?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {b.medicine?.medicineCode} • {b.medicine?.strength}
                        </div>
                      </td>
                      <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td>
                        <Badge
                          variant={
                            isExpired
                              ? 'danger'
                              : days <= 30
                              ? 'danger'
                              : days <= 60
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {isExpired ? 'Expired' : `${days}d left`}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 700, color: b.quantityAvailable > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {b.quantityAvailable} {b.medicine?.unit || 'units'}
                      </td>
                      <td>{b.purchaseCost ? `$${Number(b.purchaseCost).toFixed(2)}` : '—'}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>
                        ${Number(b.sellingPrice || b.medicine?.sellingPrice || 0).toFixed(2)}
                      </td>
                      <td>
                        <Badge variant={b.status === 'Active' && !isExpired ? 'success' : 'danger'}>
                          {isExpired ? 'Expired' : b.status}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustBatch(b);
                              setAdjustQty('');
                              setAdjustReason('');
                            }}
                          >
                            Adjust
                          </Button>
                          {b.quantityAvailable > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => {
                                setWriteOffBatch(b);
                                setWriteOffReason('');
                              }}
                              style={{ color: '#ef4444' }}
                            >
                              Write Off
                            </Button>
                          )}
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

      {/* Stock Adjustment Modal */}
      {adjustBatch && (
        <Modal
          isOpen={!!adjustBatch}
          onClose={() => setAdjustBatch(null)}
          title={`Adjust Stock — Batch ${adjustBatch.batchNumber}`}
        >
          <form onSubmit={handleAdjustSubmit}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{adjustBatch.medicine?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Current Available Quantity: <strong style={{ color: '#10b981' }}>{adjustBatch.quantityAvailable}</strong> units
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <InputField
                label="Quantity Change (Signed Integer e.g. +10 or -5) *"
                type="number"
                placeholder="e.g. -2 for damage, +15 for count audit"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Positive number increases inventory; negative number decreases inventory.
              </div>
            </div>

            <TextareaField
              label="Mandatory Reason / Audit Note *"
              placeholder="e.g. Broken ampoule during transport, monthly physical audit recount..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              rows={3}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setAdjustBatch(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submittingAdjust}
                style={{ background: '#059669', borderColor: '#047857' }}
              >
                Apply Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Write Off Expiry Modal */}
      {writeOffBatch && (
        <Modal
          isOpen={!!writeOffBatch}
          onClose={() => setWriteOffBatch(null)}
          title={`Write Off Batch Stock — ${writeOffBatch.batchNumber}`}
        >
          <form onSubmit={handleWriteOffSubmit}>
            <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                Confirm Expiry Write-Off
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This will zero out all remaining <strong style={{ color: 'var(--text-primary)' }}>{writeOffBatch.quantityAvailable} units</strong> of {writeOffBatch.medicine?.name} and create an immutable <Badge variant="danger">EXPIRY_WRITE_OFF</Badge> ledger transaction.
              </div>
            </div>

            <TextareaField
              label="Mandatory Clinical / Quarantine Reason *"
              placeholder="e.g. Reached expiry threshold, cold chain breakdown, quarantined for destruction..."
              value={writeOffReason}
              onChange={(e) => setWriteOffReason(e.target.value)}
              rows={3}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setWriteOffBatch(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={submittingWriteOff}
              >
                Confirm Write-Off
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistBatchesPage;
