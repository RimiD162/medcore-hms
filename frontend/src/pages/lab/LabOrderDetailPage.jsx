import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  TestTube,
  Activity,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  XCircle,
  Microscope,
  Calendar,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, loading, error, refetch } = useLabData(
    () => labApi.getOrderById(id),
    [id]
  );

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    setActionError(null);
    try {
      await labApi.cancelOrder(id, { reason: cancelReason });
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingState message="Loading diagnostic order details..." />;
  if (error || !order) return <ErrorState message={error || 'Order not found'} onRetry={refetch} />;

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'STAT':
        return 'danger';
      case 'URGENT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
      case 'SAMPLE_COLLECTED':
        return 'primary';
      case 'SAMPLE_PENDING':
      case 'ORDERED':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/orders')}>
            Back to Orders
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#8b5cf6' }}>{order.orderNumber}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              icon={XCircle}
              onClick={() => setShowCancelModal(true)}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              Cancel Diagnostic Order
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Order Header Summary Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: '#8b5cf6',
                }}
              >
                {order.orderNumber}
              </span>
              <Badge variant={getPriorityBadgeVariant(order.priority)}>{order.priority}</Badge>
              <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Placed on {new Date(order.createdAt).toLocaleString()} &bull; Last updated {new Date(order.updatedAt).toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diagnostic Items Ordered</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {order.items?.length || 0} Test{order.items?.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* 3-Column Info Grid: Patient / Physician / Clinical Indication */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          {/* Patient Demographic Projection */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <User size={14} color="#3b82f6" /> Patient Demographic Summary
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {order.patient?.fullName || 'Patient Name'}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              MRN / ID: <strong style={{ color: 'var(--text-primary)' }}>{order.patient?.patientId || 'N/A'}</strong>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Gender: {order.patient?.gender || 'N/A'} &bull; Age: {order.patient?.age ? `${order.patient.age} yrs` : 'N/A'}
            </div>
            {order.patient?.phone && (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Phone: {order.patient?.phone}
              </div>
            )}
          </div>

          {/* Ordering Doctor */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Activity size={14} color="#10b981" /> Prescribing Clinician
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Dr. {order.orderingDoctor?.user?.fullName || order.orderingDoctor?.fullName || 'Physician'}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Specialization: {order.orderingDoctor?.specialization || 'Clinical Staff'}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Department: {order.orderingDoctor?.department || 'Outpatient Clinic (OPD)'}
            </div>
          </div>

          {/* Clinical Indications */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <FileText size={14} color="#f59e0b" /> Clinical Indications / Diagnosis
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {order.clinicalNotes || 'Routine investigation prescribed during doctor consultation.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Ordered Investigations Items Table */}
      <Card style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={18} color="#8b5cf6" /> Ordered Laboratory Investigations ({order.items?.length || 0})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px' }}>Test Code</th>
                <th style={{ padding: '10px 12px' }}>Investigation Name</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Specimen Type</th>
                <th style={{ padding: '10px 12px' }}>Item Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#8b5cf6' }}>
                    {item.test?.code || 'TEST'}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.test?.name || 'Diagnostic Investigation'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Badge variant="default">{item.test?.category || 'General'}</Badge>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {item.test?.sampleType || 'Blood'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {item.result ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/lab/worklist/${item.id}`)}
                      >
                        View Results &rarr;
                      </Button>
                    ) : item.status === 'SAMPLE_COLLECTED' || item.status === 'PROCESSING' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Activity}
                        onClick={() => navigate(`/app/lab/worklist/${item.id}`)}
                      >
                        Enter Results
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Awaiting Specimen
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Linked Specimen Containers & Custody */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TestTube size={18} color="#3b82f6" /> Linked Specimen Samples & Chain of Custody ({order.samples?.length || 0})
          </h3>

          <Button
            variant="outline"
            size="sm"
            icon={TestTube}
            onClick={() => navigate('/app/lab/samples')}
          >
            Go to Specimen Collection Hub &rarr;
          </Button>
        </div>

        {(!order.samples || order.samples.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
            No specimen tubes linked yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {order.samples.map((sample) => (
              <div
                key={sample.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/app/lab/samples/${sample.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#3b82f6' }}>
                    {sample.sampleCode}
                  </span>
                  <Badge variant={sample.status === 'REJECTED' ? 'danger' : sample.status === 'PROCESSED' || sample.status === 'RECEIVED' ? 'success' : 'warning'}>
                    {sample.status}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                  {sample.sampleType} &bull; {sample.containerType || 'Standard Tube'}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {sample.collectedAt ? (
                    <div>Collected: {new Date(sample.collectedAt).toLocaleString()} by {sample.collectedBy?.fullName || 'Technician'}</div>
                  ) : (
                    <div style={{ color: '#f59e0b' }}>Awaiting Collection (Patient ID Check required)</div>
                  )}

                  {sample.receivedAt && (
                    <div>Received in Lab: {new Date(sample.receivedAt).toLocaleString()}</div>
                  )}

                  {sample.rejectionReason && (
                    <div style={{ color: '#ef4444', fontWeight: 600 }}>Rejected: {sample.rejectionReason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cancel Diagnostic Order
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Please provide a clinical or operational reason for cancelling order <strong>{order.orderNumber}</strong>.
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Duplicate order, patient requested discharge, test ordered in error..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
                Go Back
              </Button>
              <Button
                variant="danger"
                disabled={!cancelReason.trim() || cancelling}
                onClick={handleCancelOrder}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Order Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOrderDetailPage;
