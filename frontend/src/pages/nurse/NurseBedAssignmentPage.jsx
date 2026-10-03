import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Users,
  Settings,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, Modal, SelectField, LoadingState, ErrorState } from '../../components/ui';

export const NurseBedAssignmentPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBed, setSelectedBed] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getBeds({ ward: wardFilter || undefined, status: statusFilter || undefined }),
    [wardFilter, statusFilter]
  );

  const stats = data?.stats || {};
  const wardGroups = data?.wardGroups || {};

  const handleOpenStatusModal = (bed) => {
    setSelectedBed(bed);
    setNewStatus(bed.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBed || !newStatus) return;
    try {
      setSubmitting(true);
      await nurseApi.updateBedStatus(selectedBed.id, newStatus);
      if (onShowToast) onShowToast(`Bed ${selectedBed.bedNumber} status updated to ${newStatus}.`);
      setSelectedBed(null);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BedDouble size={24} color="#00d2b4" />
            Hospital Bed Allocation Grid
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time ward occupancy, room allocation, and bed turnover status
          </p>
        </div>

        <Badge variant="teal" style={{ padding: '8px 14px', fontSize: '0.9rem' }}>
          Ward Occupancy Rate: <strong>{stats.occupancyRate || 0}%</strong>
        </Badge>
      </div>

      {/* Ward Metrics Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>Total Beds</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{stats.totalBeds || 0}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600' }}>Available Beds</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{stats.availableBeds || 0}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '600' }}>Occupied Beds</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>{stats.occupiedBeds || 0}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>Reserved / Cleaning</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>{stats.reservedBeds || 0}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600' }}>Maintenance</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f87171', marginTop: '4px' }}>{stats.maintenanceBeds || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div>
            <SelectField
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              options={[
                { value: '', label: 'All Hospital Wards' },
                { value: 'Ward 3B', label: 'Ward 3B - General Medical' },
                { value: 'ICU', label: 'ICU - Intensive Care Unit' },
                { value: 'Maternity', label: 'Maternity Ward' },
              ]}
              style={{ margin: 0 }}
            />
          </div>

          <div>
            <SelectField
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Bed Statuses' },
                { value: 'AVAILABLE', label: 'Available (Ready for Admission)' },
                { value: 'OCCUPIED', label: 'Occupied (Patient Assigned)' },
                { value: 'RESERVED', label: 'Reserved / Turnover' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
              ]}
              style={{ margin: 0 }}
            />
          </div>
        </div>
      </Card>

      {/* Ward Groups Grid */}
      {loading ? (
        <LoadingState message="Loading hospital bed layout..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Object.entries(wardGroups).map(([wardName, beds]) => (
            <div key={wardName}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d2b4' }} />
                  {wardName}
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {beds.length} Total Beds ({beds.filter((b) => b.status === 'OCCUPIED').length} Occupied)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {beds.map((bed) => {
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isAvailable = bed.status === 'AVAILABLE';

                  return (
                    <Card
                      key={bed.id}
                      style={{
                        padding: '16px',
                        background: isOccupied
                          ? 'rgba(56, 189, 248, 0.05)'
                          : isAvailable
                          ? 'rgba(52, 211, 153, 0.05)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isOccupied
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : isAvailable
                          ? '1px solid rgba(52, 211, 153, 0.3)'
                          : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#fff' }}>
                            {bed.bedNumber}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                            Room {bed.roomNumber}
                          </div>
                        </div>

                        <Badge
                          variant={
                            isAvailable
                              ? 'emerald'
                              : isOccupied
                              ? 'blue'
                              : bed.status === 'RESERVED'
                              ? 'amber'
                              : 'rose'
                          }
                        >
                          {bed.status}
                        </Badge>
                      </div>

                      {bed.patient ? (
                        <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))', marginBottom: '12px' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                            {bed.patient.fullName}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                            {bed.patient.patientIdNumber} &bull; {bed.patient.age}y &bull; {bed.patient.gender}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#38bdf8', marginTop: '4px' }}>
                            Diag: {bed.patient.diagnosis || 'Under Observation'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
                          Ready for Patient Admission
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingTop: '10px' }}>
                        {bed.patient?.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/app/nurse/patients/${bed.patient.id}`)}
                          >
                            View Patient <ChevronRight size={13} />
                          </Button>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(bed)}
                          style={{ background: 'none', border: 'none', color: '#00d2b4', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Change Status
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Modal */}
      {selectedBed && (
        <Modal
          isOpen={!!selectedBed}
          onClose={() => setSelectedBed(null)}
          title={`Update Status: ${selectedBed.bedNumber} (${selectedBed.ward})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SelectField
              label="Bed Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: 'AVAILABLE', label: 'AVAILABLE (Sanitized & Open)' },
                { value: 'RESERVED', label: 'RESERVED (Cleaning / Turnover in Progress)' },
                { value: 'MAINTENANCE', label: 'MAINTENANCE (Repair / Sanitization)' },
                { value: 'OCCUPIED', label: 'OCCUPIED (Active Patient)' },
              ]}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setSelectedBed(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleUpdateStatus} disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Status'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NurseBedAssignmentPage;
