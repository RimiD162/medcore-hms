import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TestTube,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  XCircle,
  QrCode,
  Layers,
  Inbox,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, LoadingState, ErrorState } from '../../components/ui';

export const LabSamplesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getSamples({
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    [search, statusFilter]
  );

  const samples = data?.samples || [];

  // Modal State for Collection
  const [collectingSample, setCollectingSample] = useState(null);
  const [patientConfirmed, setPatientConfirmed] = useState(false);
  const [tubeConfirmed, setTubeConfirmed] = useState(false);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);
  const [collectionError, setCollectionError] = useState(null);

  // Modal State for Rejection
  const [rejectingSample, setRejectingSample] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('HEMOLYZED');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [autoRecollect, setAutoRecollect] = useState(true);
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [rejectionError, setRejectionError] = useState(null);

  // Open Collection Modal
  const handleOpenCollectModal = (sample) => {
    setCollectingSample(sample);
    setPatientConfirmed(false);
    setTubeConfirmed(false);
    setCollectionNotes('');
    setCollectionError(null);
  };

  // Submit Specimen Collection
  const handleSubmitCollection = async () => {
    if (!patientConfirmed || !tubeConfirmed) {
      setCollectionError('You must confirm both positive patient ID and specimen tube match before proceeding.');
      return;
    }
    setCollectionSubmitting(true);
    setCollectionError(null);
    try {
      await labApi.collectSample(collectingSample.id, {
        patientConfirmed: true,
        collectionNotes: collectionNotes || undefined,
      });
      setCollectingSample(null);
      refetch();
    } catch (err) {
      setCollectionError(err.response?.data?.message || err.message || 'Failed to record specimen collection');
    } finally {
      setCollectionSubmitting(false);
    }
  };

  // Receive Specimen Into Lab Custody
  const handleReceiveSample = async (sampleId) => {
    try {
      await labApi.receiveSample(sampleId, {
        storageLocation: 'Main Bench Specimen Rack A1',
      });
      refetch();
    } catch (err) {
      console.error('Failed to receive specimen into lab:', err);
    }
  };

  // Open Rejection Modal
  const handleOpenRejectModal = (sample) => {
    setRejectingSample(sample);
    setRejectionReason('HEMOLYZED');
    setRejectionNotes('');
    setAutoRecollect(true);
    setRejectionError(null);
  };

  // Submit Rejection & Optional Recollection
  const handleSubmitRejection = async () => {
    setRejectionSubmitting(true);
    setRejectionError(null);
    try {
      await labApi.rejectSample(rejectingSample.id, {
        reason: rejectionReason,
        notes: rejectionNotes || undefined,
      });

      if (autoRecollect) {
        await labApi.recollectSample(rejectingSample.id);
      }

      setRejectingSample(null);
      refetch();
    } catch (err) {
      setRejectionError(err.response?.data?.message || err.message || 'Failed to reject specimen');
    } finally {
      setRejectionSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'RECEIVED':
      case 'PROCESSED':
        return 'success';
      case 'COLLECTED':
      case 'PROCESSING':
        return 'primary';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Specimen Collection & Custody Intake
            </h1>
            <Badge variant="primary">{samples.length} Specimen Tubes</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Mandatory positive patient ID check, barcode tracking, laboratory custody handoff, and quality rejection controls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            icon={QrCode}
            onClick={() => {
              const barcode = prompt('Scan / Enter Specimen Barcode:');
              if (barcode) setSearch(barcode.trim());
            }}
          >
            Scan Barcode
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <Input
              placeholder="Search by Sample Barcode (e.g. SMP-2026-0001) or Patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div>
            <select
              className="med-select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Specimen Statuses</option>
              <option value="PENDING">PENDING (Awaiting Draw)</option>
              <option value="COLLECTED">COLLECTED (In Transit)</option>
              <option value="RECEIVED">RECEIVED (In Lab Bench)</option>
              <option value="PROCESSING">PROCESSING (In Analyzer)</option>
              <option value="PROCESSED">PROCESSED (Finished)</option>
              <option value="REJECTED">REJECTED (Quality Breach)</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Samples List */}
      {loading ? (
        <LoadingState message="Loading specimen queue..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : samples.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Inbox size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Specimen Samples in Queue
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {search || statusFilter
              ? 'No matching samples found for your search.'
              : 'All diagnostic test specimens have been collected and processed.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {samples.map((sample) => (
            <Card
              key={sample.id}
              style={{
                padding: '16px 20px',
                border: sample.status === 'REJECTED' ? '1px solid rgba(239, 68, 68, 0.4)' : sample.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                background: sample.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.03)' : 'var(--card-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Left: Barcode, Status, Tube Spec */}
                <div style={{ minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', color: '#3b82f6' }}>
                      {sample.sampleCode}
                    </span>
                    <Badge variant={getStatusBadgeVariant(sample.status)}>
                      {sample.status}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {sample.sampleType} &bull; <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{sample.containerType || 'Standard Tube'}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Order: <strong style={{ color: '#8b5cf6' }}>{sample.order?.orderNumber}</strong> &bull; Priority: {sample.order?.priority || 'ROUTINE'}
                  </div>
                </div>

                {/* Middle: Patient & Custody Info */}
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {sample.patient?.fullName || 'Patient'}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>
                      (MRN: {sample.patient?.patientId || 'N/A'})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {sample.status === 'PENDING' && (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        &bull; Awaiting Collection: Verify Positive Patient ID before phlebotomy draw
                      </span>
                    )}

                    {sample.collectedAt && (
                      <span>
                        &bull; Drawn at {new Date(sample.collectedAt).toLocaleTimeString()} by {sample.collectedBy?.fullName || 'Phlebotomist'}
                      </span>
                    )}

                    {sample.receivedAt && (
                      <span style={{ color: '#10b981' }}>
                        &bull; Received in Lab: {new Date(sample.receivedAt).toLocaleTimeString()} ({sample.storageLocation || 'Bench A1'})
                      </span>
                    )}

                    {sample.rejectionReason && (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        &bull; Rejected: {sample.rejectionReason} {sample.rejectionNotes ? `(${sample.rejectionNotes})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Operational Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sample.status === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={UserCheck}
                      onClick={() => handleOpenCollectModal(sample)}
                    >
                      Collect Specimen
                    </Button>
                  )}

                  {sample.status === 'COLLECTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleReceiveSample(sample.id)}
                    >
                      Receive Into Lab
                    </Button>
                  )}

                  {sample.status !== 'REJECTED' && sample.status !== 'PROCESSED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRejectModal(sample)}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Reject Tube
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/app/lab/samples/${sample.id}`)}
                  >
                    Details &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mandatory Patient Confirmation Collection Modal */}
      {collectingSample && (
        <div className="modal-overlay" onClick={() => setCollectingSample(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Mandatory Positive Patient ID Check
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Specimen Barcode: <strong style={{ color: '#3b82f6' }}>{collectingSample.sampleCode}</strong>
                </span>
              </div>
            </div>

            {collectionError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                }}
              >
                {collectionError}
              </div>
            )}

            {/* Projected Patient Demographics for Visual Confirmation */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                MATCH TWO (2) INDEPENDENT IDENTIFIERS:
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {collectingSample.patient?.fullName || 'Patient Name'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Hospital MRN: <strong style={{ color: 'var(--text-primary)' }}>{collectingSample.patient?.patientId || 'N/A'}</strong>
                &bull; Gender: {collectingSample.patient?.gender || 'N/A'} &bull; Age: {collectingSample.patient?.age ? `${collectingSample.patient.age}y` : 'N/A'}
              </div>
              {collectingSample.patient?.phone && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Phone / Contact: {collectingSample.patient.phone}
                </div>
              )}
            </div>

            {/* Required Verification Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: patientConfirmed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: patientConfirmed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={patientConfirmed}
                  onChange={(e) => setPatientConfirmed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>I have verified 2 positive patient identifiers</strong> (Full Name and DOB/MRN) verbally or via wristband.
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: tubeConfirmed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: tubeConfirmed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={tubeConfirmed}
                  onChange={(e) => setTubeConfirmed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>Specimen Tube Correctness Confirmed:</strong> {collectingSample.sampleType} container ({collectingSample.containerType || 'Standard Specimen Container'}).
                </span>
              </label>
            </div>

            {/* Collection Notes */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Collection Notes / Phlebotomy Site (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Left median cubital vein, fasting confirmed, smooth draw..."
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="ghost" onClick={() => setCollectingSample(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle2}
                disabled={!patientConfirmed || !tubeConfirmed || collectionSubmitting}
                onClick={handleSubmitCollection}
              >
                {collectionSubmitting ? 'Recording Draw...' : 'Confirm Positive ID & Draw'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Rejection Modal */}
      {rejectingSample && (
        <div className="modal-overlay" onClick={() => setRejectingSample(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Specimen Quality Rejection
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Rejecting Tube: <strong style={{ color: '#ef4444' }}>{rejectingSample.sampleCode}</strong>
                </span>
              </div>
            </div>

            {rejectionError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                }}
              >
                {rejectionError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Standard Pre-Analytical Rejection Reason *
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              >
                <option value="HEMOLYZED">HEMOLYZED (Severe Red Cell Lysis)</option>
                <option value="CLOTTED">CLOTTED (Fibrin Clots in EDTA/Plasma)</option>
                <option value="INSUFFICIENT_VOLUME">INSUFFICIENT_VOLUME (Quantity Not Sufficient / QNS)</option>
                <option value="INCORRECT_CONTAINER">INCORRECT_CONTAINER (Wrong Anticoagulant Tube)</option>
                <option value="UNLABELED">UNLABELED / MISLABELED SPECIMEN</option>
                <option value="TEMPERATURE_BREACH">TEMPERATURE_BREACH (Cold Chain / Transport Failure)</option>
                <option value="CONTAMINATED">CONTAMINATED SPECIMEN</option>
                <option value="OTHER">OTHER (Specify Details)</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Rejection Notes / Lab Observations
              </label>
              <textarea
                rows={2}
                placeholder="Additional notes for attending physician..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                cursor: 'pointer',
                marginBottom: '18px',
              }}
            >
              <input
                type="checkbox"
                checked={autoRecollect}
                onChange={(e) => setAutoRecollect(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <strong>Trigger Automatic Recollection Request</strong> (links new specimen tube to order)
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="ghost" onClick={() => setRejectingSample(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={rejectionSubmitting}
                onClick={handleSubmitRejection}
              >
                {rejectionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabSamplesPage;
