import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import useReceptionistData from '../../hooks/useReceptionistData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistAdmissionsPage = () => {
  const navigate = useNavigate();
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useReceptionistData(receptionistApi.getAdmissionStats);
  const { data: bedMatrixData, loading: matrixLoading, error, refetch: refetchMatrix } = useReceptionistData(receptionistApi.getBedMatrix);

  const [selectedWard, setSelectedWard] = useState('ALL');
  const [search, setSearch] = useState('');

  if (statsLoading || matrixLoading) {
    return <LoadingState message="Loading hospital ward bed matrix & inpatient roster..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => { refetchStats(); refetchMatrix(); }} />;
  }

  const stats = statsData || {};
  const wards = bedMatrixData?.wards || [];
  const admissions = bedMatrixData?.admissions || [];

  const filteredWards = selectedWard === 'ALL'
    ? wards
    : wards.filter((w) => w.wardName === selectedWard);

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BedDouble size={28} color="#00d2b4" /> Inpatient Admissions & Ward Matrix
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Operational read-only overview of bed allocations, occupancy levels, and admitted patient locations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchMatrix(); }}>
          <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Matrix
        </Button>
      </div>

      {/* 2. Key Occupancy StatCards */}
      <div className="med-stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Total Hospital Beds"
          value={stats.totalBeds || 120}
          subtitle="Capacity across all active wards"
          icon={BedDouble}
          color="#00d2b4"
        />
        <StatCard
          title="Occupied Beds"
          value={stats.occupiedBeds || admissions.length}
          subtitle="Patients currently admitted"
          icon={Users}
          color="#f59e0b"
        />
        <StatCard
          title="Available Beds"
          value={(stats.totalBeds || 120) - (stats.occupiedBeds || admissions.length)}
          subtitle="Ready for new admissions"
          icon={CheckCircle2}
          color="#10b981"
        />
        <StatCard
          title="Ward Occupancy Rate"
          value={`${stats.occupancyRate || Math.round(((stats.occupiedBeds || admissions.length) / (stats.totalBeds || 120)) * 100)}%`}
          subtitle="Real-time facility utilization"
          icon={Building2}
          color="#0284c7"
        />
      </div>

      {/* 3. Ward Filter & Search */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`med-tab-btn ${selectedWard === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedWard('ALL')}
            >
              All Wards ({wards.length})
            </button>
            {wards.map((w, idx) => (
              <button
                key={idx}
                type="button"
                className={`med-tab-btn ${selectedWard === w.wardName ? 'active' : ''}`}
                onClick={() => setSelectedWard(w.wardName)}
              >
                {w.wardName} ({w.beds?.length || 0})
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="med-form-input"
              style={{ width: '100%', paddingLeft: '32px' }}
              placeholder="Filter by patient name or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* 4. Ward Bed Matrices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
        {filteredWards.map((ward, wIdx) => {
          const wardBeds = ward.beds || [];
          const filteredBeds = search
            ? wardBeds.filter(
                (b) =>
                  b.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
                  (b.patientName && b.patientName.toLowerCase().includes(search.toLowerCase()))
              )
            : wardBeds;

          return (
            <Card
              key={wIdx}
              title={ward.wardName}
              subtitle={`${ward.department || 'Inpatient Care'} • ${wardBeds.filter((b) => b.isOccupied).length} Occupied / ${wardBeds.length} Total`}
              extra={
                <Badge variant={ward.occupancyRate > 80 ? 'danger' : 'teal'}>
                  {ward.occupancyRate || Math.round((wardBeds.filter((b) => b.isOccupied).length / wardBeds.length) * 100)}% Occupancy
                </Badge>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {filteredBeds.map((bed, bIdx) => {
                  const isOcc = bed.isOccupied;

                  return (
                    <div
                      key={bIdx}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: isOcc ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                        border: isOcc ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                          Bed {bed.bedNumber}
                        </span>
                        <Badge variant={isOcc ? 'amber' : 'teal'}>
                          {isOcc ? 'Occupied' : 'Available'}
                        </Badge>
                      </div>

                      {isOcc ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.85rem' }}>
                            {bed.patientName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {bed.patientIdNumber}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#00d2b4', marginTop: '4px' }}>
                            Dr. {bed.admittingDoctor?.split(' ')[0] || 'Staff'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px' }}>
                          Ready for assignment
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5. Active Inpatients Table */}
      <Card title="Current Admitted Inpatients (Operational List)">
        {admissions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
            No patients currently admitted in hospital wards.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT NAME</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT ID</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>LOCATION</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>ADMISSION DATE</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>ADMITTING DOCTOR</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm) => (
                  <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                      {adm.patient?.fullName}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#00d2b4', fontWeight: '700' }}>
                      {adm.patient?.patientIdNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                      {adm.ward} &bull; Bed {adm.bedNumber}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted, #94a3b8)' }}>
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                      Dr. {adm.admittingDoctor?.user?.fullName || 'Assigned Staff'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge variant="amber">{adm.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReceptionistAdmissionsPage;
