import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  Clock,
  TestTube,
  Activity,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, LoadingState, ErrorState } from '../../components/ui';

export const LabOrdersPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
    [search, statusFilter, priorityFilter]
  );

  const orders = data?.orders || [];

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
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Diagnostic Orders & Requests
            </h1>
            <Badge variant="primary">{orders.length} Total Orders</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Doctor-prescribed laboratory investigation orders with multi-test grouping, specimen custody tracking, and billing.
          </p>
        </div>

        <Button
          variant="outline"
          icon={TestTube}
          onClick={() => navigate('/app/lab/samples')}
        >
          Specimen Collection Queue
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <Input
              placeholder="Search by Order # (e.g. LAB-2026-0001) or Patient Name..."
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
              <option value="">All Order Statuses</option>
              <option value="ORDERED">ORDERED (Pending Specimen)</option>
              <option value="SAMPLE_PENDING">SAMPLE_PENDING</option>
              <option value="SAMPLE_COLLECTED">SAMPLE_COLLECTED</option>
              <option value="PROCESSING">PROCESSING (In Lab)</option>
              <option value="COMPLETED">COMPLETED (Released)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <select
              className="med-select-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Priorities</option>
              <option value="STAT">STAT (Immediate Emergency)</option>
              <option value="URGENT">URGENT (Priority SLA)</option>
              <option value="ROUTINE">ROUTINE</option>
            </select>
          </div>

          {(search || statusFilter || priorityFilter) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Orders List / Table */}
      {loading ? (
        <LoadingState message="Loading diagnostic orders..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ClipboardList size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Diagnostic Orders Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {search || statusFilter || priorityFilter
              ? 'Try modifying your search or status filters.'
              : 'New test orders placed by attending doctors in EMR will appear here.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => (
            <Card
              key={order.id}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '16px 20px',
                border: order.priority === 'STAT' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                background: order.priority === 'STAT' ? 'rgba(239, 68, 68, 0.03)' : 'var(--card-bg)',
              }}
              onClick={() => navigate(`/app/lab/orders/${order.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Left Block: Order Number, Patient & Doctor */}
                <div style={{ minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#8b5cf6', fontFamily: 'monospace' }}>
                      {order.orderNumber}
                    </span>
                    <Badge variant={getPriorityBadgeVariant(order.priority)}>
                      {order.priority}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--text-secondary)" />
                    {order.patient?.fullName || 'Patient'}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      ({order.patient?.gender || 'N/A'}, {order.patient?.age ? `${order.patient.age}y` : 'Age N/A'}) &bull; ID: {order.patient?.patientId || 'N/A'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Ordering: Dr. {order.orderingDoctor?.user?.fullName || order.orderingDoctor?.fullName || 'Hospital Physician'} &bull; {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Middle Block: Tests & Specimen Status */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Ordered Investigations ({order.items?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {order.items?.map((item) => (
                      <span
                        key={item.id}
                        style={{
                          fontSize: '0.78rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <strong>{item.test?.name || 'Test'}</strong> ({item.status})
                      </span>
                    ))}
                  </div>

                  {order.samples && order.samples.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: '#3b82f6' }}>
                      <TestTube size={12} />
                      <span>
                        {order.samples.length} Specimen Barcode{order.samples.length > 1 ? 's' : ''}: {order.samples.map((s) => s.sampleCode).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Block: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Button variant="outline" size="sm" icon={Eye}>
                    Order Details &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabOrdersPage;
