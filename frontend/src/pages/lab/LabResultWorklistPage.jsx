import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  Microscope,
  User,
  FlaskConical,
  ArrowRight,
  Filter,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, LoadingState, ErrorState } from '../../components/ui';

export const LabResultWorklistPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getOrders({
        search: search || undefined,
      }),
    [search]
  );

  // Flatten order items into worklist entries
  const orders = data?.orders || [];
  const worklistItems = [];

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!statusFilter || item.status === statusFilter) {
        worklistItems.push({
          ...item,
          order,
          patient: order.patient,
          priority: order.priority,
        });
      }
    });
  });

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
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Laboratory Result Entry Worklist
            </h1>
            <Badge variant="primary">{worklistItems.length} Tests in Queue</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Real-time analyzer bench queue. Enter multi-parameter findings, evaluate panic thresholds, and log correction histories.
          </p>
        </div>

        <Button
          variant="outline"
          icon={Microscope}
          onClick={() => navigate('/app/lab/reports')}
        >
          Reports & Releases &rarr;
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <Input
              placeholder="Search by test name, patient, or order #..."
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
              <option value="">All Worklist Statuses</option>
              <option value="SAMPLE_COLLECTED">Ready for Entry (Sample Collected)</option>
              <option value="PROCESSING">PROCESSING (In Progress)</option>
              <option value="COMPLETED">COMPLETED (Result Entered)</option>
              <option value="SAMPLE_PENDING">SAMPLE_PENDING (Awaiting Draw)</option>
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

      {/* Worklist Items */}
      {loading ? (
        <LoadingState message="Loading laboratory worklist..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : worklistItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Activity size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Worklist is Empty
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {search || statusFilter
              ? 'No tests match your filter criteria.'
              : 'All collected diagnostic investigations have been evaluated.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {worklistItems.map((item) => (
            <Card
              key={item.id}
              style={{
                padding: '16px 20px',
                border: item.priority === 'STAT' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                background: item.priority === 'STAT' ? 'rgba(239, 68, 68, 0.03)' : 'var(--card-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Left: Test Code, Name, Category */}
                <div style={{ minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#8b5cf6' }}>
                      {item.test?.code || 'TEST'}
                    </span>
                    <Badge variant={item.priority === 'STAT' ? 'danger' : 'default'}>
                      {item.priority}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </div>

                  <h3 style={{ margin: '0 0 2px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.test?.name}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Category: {item.test?.category || 'Biochemistry'} &bull; Specimen: {item.test?.sampleType || 'Blood'}
                  </div>
                </div>

                {/* Middle: Patient & Order Info */}
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.patient?.fullName || 'Patient'}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>
                      (MRN: {item.patient?.patientId || 'N/A'})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Order: <strong style={{ color: '#8b5cf6' }}>{item.order?.orderNumber}</strong> &bull; Ordering: Dr. {item.order?.orderingDoctor?.user?.fullName || 'Physician'}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Parameters to evaluate: {item.test?.parameters?.length || 0} parameter rows
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.result ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={FileEdit}
                      onClick={() => navigate(`/app/lab/worklist/${item.id}`)}
                    >
                      Edit / Correct Results &rarr;
                    </Button>
                  ) : item.status === 'SAMPLE_COLLECTED' || item.status === 'PROCESSING' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Activity}
                      onClick={() => navigate(`/app/lab/worklist/${item.id}`)}
                    >
                      Enter Analyzer Results
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/app/lab/samples')}
                    >
                      Awaiting Specimen Draw
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabResultWorklistPage;
