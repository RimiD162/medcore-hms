import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TestTube,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MapPin,
  QrCode,
  Layers,
  Activity,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabSampleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sample, loading, error, refetch } = useLabData(
    () => labApi.getSampleById(id),
    [id]
  );

  if (loading) return <LoadingState message="Loading specimen sample details & custody chain..." />;
  if (error || !sample) return <ErrorState message={error || 'Specimen sample not found'} onRetry={refetch} />;

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
    <div className="med-page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/samples')}>
            Back to Specimen Queue
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#3b82f6' }}>{sample.sampleCode}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {sample.order && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/lab/orders/${sample.orderId}`)}
            >
              View Order {sample.order?.orderNumber} &rarr;
            </Button>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem', color: '#3b82f6' }}>
                {sample.sampleCode}
              </span>
              <Badge variant={getStatusBadgeVariant(sample.status)}>{sample.status}</Badge>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {sample.sampleType} &bull; <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{sample.containerType || 'Standard Specimen Tube'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Associated Order</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>
              {sample.order?.orderNumber || 'N/A'}
            </div>
          </div>
        </div>

        {/* Patient & Storage Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Patient Demographic
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {sample.patient?.fullName || 'Patient Name'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              MRN: {sample.patient?.patientId || 'N/A'} &bull; {sample.patient?.gender || 'N/A'}, {sample.patient?.age ? `${sample.patient.age}y` : 'Age N/A'}
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Current Physical Location
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <MapPin size={15} color="#10b981" />
              {sample.storageLocation || (sample.status === 'PENDING' ? 'Phlebotomy Waiting Area' : 'Laboratory Bench A1')}
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Storage Spec
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {sample.storageCondition || 'Ambient (18-25°C)'}
            </span>
          </div>
        </div>
      </Card>

      {/* Custody Chain Timeline */}
      <Card style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#3b82f6" /> Specimen Chain of Custody & Audit Trail
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
          {/* Timeline Step 1: Order Placement */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Investigation Prescribed & Specimen Tube Generated
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(sample.createdAt).toLocaleString()} &bull; Diagnostic Order: {sample.order?.orderNumber}
              </div>
            </div>
          </div>

          {/* Timeline Step 2: Phlebotomy Collection */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sample.collectedAt ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: sample.collectedAt ? '#10b981' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: sample.collectedAt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {sample.collectedAt ? 'Positive Patient ID Verified & Specimen Drawn' : 'Awaiting Phlebotomy Collection'}
              </div>
              {sample.collectedAt && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(sample.collectedAt).toLocaleString()} by {sample.collectedBy?.fullName || 'Phlebotomist'}
                  {sample.collectionNotes && ` (${sample.collectionNotes})`}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Step 3: Receipt in Lab */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sample.receivedAt ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: sample.receivedAt ? '#10b981' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TestTube size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: sample.receivedAt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {sample.receivedAt ? 'Received into Laboratory Custody' : 'Awaiting Laboratory Intake'}
              </div>
              {sample.receivedAt && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(sample.receivedAt).toLocaleString()} by {sample.receivedBy?.fullName || 'Lab Staff'} &bull; Shelf: {sample.storageLocation || 'Bench A1'}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Step 4: Rejection or Completion */}
          {sample.rejectionReason && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={14} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef4444' }}>
                  Specimen Quality Rejection Logged: {sample.rejectionReason}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {sample.rejectedAt ? new Date(sample.rejectedAt).toLocaleString() : 'Recent'} by {sample.rejectedBy?.fullName || 'Quality Controller'}
                  {sample.rejectionNotes && ` &bull; Notes: "${sample.rejectionNotes}"`}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LabSampleDetailPage;
