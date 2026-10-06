import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  CalendarClock,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Boxes,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, StatCard, Badge, Button, Tabs, Modal, TextareaField, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistExpiryPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [activeBucket, setActiveBucket] = useState('ALL');

  // Write Off Modal State
  const [writeOffBatch, setWriteOffBatch] = useState(null);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [submittingWriteOff, setSubmittingWriteOff] = useState(false);

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getExpiryBuckets({
        bucket: activeBucket !== 'ALL' ? activeBucket : undefined,
        limit: 50,
      }),
    [activeBucket]
  );

  const batches = data?.batches || [];
  const summary = data?.summary || {};

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
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Expiry Tracking & Risk Triage
            </h1>
            <Badge variant="warning">FEFO Monitoring</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Categorized risk windows: quarantine & write off expired units, prioritize near-expiry batches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Layers}
            onClick={() => navigate('/app/pharmacist/batches')}
          >
            Batch Inventory
          </Button>
        </div>
      </div>

      {/* Summary KPI Risk Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="Expired Batches"
          value={summary.expiredCount || 0}
          icon={ShieldAlert}
          color="rose"
          change="Write-off Required"
          changeType="negative"
        />
        <StatCard
          title="Expiring &le; 30 Days"
          value={summary.in30DaysCount || 0}
          icon={CalendarClock}
          color="rose"
          change="FEFO Priority 1"
          changeType="negative"
        />
        <StatCard
          title="Expiring &le; 60 Days"
          value={summary.in60DaysCount || 0}
          icon={CalendarClock}
          color="amber"
          change="FEFO Priority 2"
          changeType="warning"
        />
        <StatCard
          title="Expiring &le; 90 Days"
          value={summary.in90DaysCount || 0}
          icon={CalendarClock}
          color="cyan"
          change="Standard Rotation"
          changeType="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeBucket}
        onChange={setActiveBucket}
        tabs={[
          { id: 'ALL', label: 'All At-Risk Batches' },
          { id: 'EXPIRED', label: `Expired (${summary.expiredCount || 0})` },
          { id: '30_DAYS', label: `30 Days (${summary.in30DaysCount || 0})` },
          { id: '60_DAYS', label: `60 Days (${summary.in60DaysCount || 0})` },
          { id: '90_DAYS', label: `90 Days (${summary.in90DaysCount || 0})` },
        ]}
      />

      {/* Table Content */}
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <LoadingState message="Scanning batches across 30/60/90-day expiry windows..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : batches.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Batches in this Expiry Category
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              All inventory batches in this category are within safe validity parameters.
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
                    <th>Days Remaining</th>
                    <th>Stock Units at Risk</th>
                    <th>Recommended Operational Action</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const days = b.daysUntilExpiry;
                    const isExpired = b.bucketName === 'EXPIRED';

                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.batchNumber}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.medicine?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {b.medicine?.medicineCode} • {b.medicine?.category}
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
                            {isExpired ? 'Expired' : `${days} days left`}
                          </Badge>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: isExpired ? '#ef4444' : 'var(--text-primary)' }}>
                            {b.quantityAvailable} {b.medicine?.unit || 'units'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          {b.recommendedAction}
                        </td>
                        <td>
                          {isExpired ? (
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => {
                                setWriteOffBatch(b);
                                setWriteOffReason('Quarantined and written off due to expiry threshold reached.');
                              }}
                            >
                              Write Off
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/app/pharmacist/dispensing')}
                            >
                              FEFO Dispense
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Write Off Modal */}
      {writeOffBatch && (
        <Modal
          isOpen={!!writeOffBatch}
          onClose={() => setWriteOffBatch(null)}
          title={`Write Off Expired Batch — ${writeOffBatch.batchNumber}`}
        >
          <form onSubmit={handleWriteOffSubmit}>
            <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                Permanent Stock Write-Off
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This will zero out the remaining <strong style={{ color: 'var(--text-primary)' }}>{writeOffBatch.quantityAvailable} units</strong> of {writeOffBatch.medicine?.name} and append an immutable <Badge variant="danger">EXPIRY_WRITE_OFF</Badge> ledger entry.
              </div>
            </div>

            <TextareaField
              label="Mandatory Reason / Quarantine Protocol Reference *"
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
                Execute Write-Off
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistExpiryPage;
