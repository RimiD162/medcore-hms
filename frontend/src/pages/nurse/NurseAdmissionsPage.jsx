import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  BedDouble,
  Calendar,
  ChevronRight,
  Users,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, InputField, SelectField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseAdmissionsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ADMITTED');

  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getAdmissions({ search, ward: wardFilter, status: statusFilter || undefined }),
    [search, wardFilter, statusFilter]
  );

  const admissions = data?.admissions || [];

  return (
    <div className="med-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="#00d2b4" />
            Inpatient Admissions Directory
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Hospital admission records, assigned beds, and attending physician tracking
          </p>
        </div>

        <Button variant="outline" onClick={() => navigate('/app/nurse/bed-assignment')}>
          <BedDouble size={15} style={{ marginRight: '6px' }} /> Bed Allocation Grid
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div>
            <InputField
              placeholder="Search by Patient Name, ID, or Diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div>
            <SelectField
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              options={[
                { value: '', label: 'All Wards' },
                { value: 'Ward 3B', label: 'Ward 3B - General Medical' },
                { value: 'ICU', label: 'ICU - Intensive Care' },
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
                { value: '', label: 'All Admission Statuses' },
                { value: 'ADMITTED', label: 'Currently Admitted' },
                { value: 'DISCHARGED', label: 'Discharged' },
                { value: 'TRANSFERRED', label: 'Transferred' },
              ]}
              style={{ margin: 0 }}
            />
          </div>
        </div>
      </Card>

      {/* Admissions Table */}
      <Card>
        {loading ? (
          <LoadingState message="Loading inpatient admissions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : admissions.length === 0 ? (
          <EmptyState
            title="No admissions found"
            description="No inpatient admission records match your search criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table">
              <thead>
                <tr>
                  <th>Admission ID</th>
                  <th>Patient Name & Demographics</th>
                  <th>Ward & Bed Location</th>
                  <th>Admitted Date</th>
                  <th>Diagnosis</th>
                  <th>Attending Physician</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm) => (
                  <tr key={adm.id}>
                    <td>
                      <strong style={{ color: '#00d2b4', fontSize: '0.88rem' }}>{adm.admissionNumber}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                        {adm.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {adm.patient?.patientIdNumber} &bull; {adm.patient?.age}y &bull; {adm.patient?.gender}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{adm.ward}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Room {adm.roomNumber} &bull; <strong style={{ color: '#fff' }}>{adm.bedNumber}</strong>
                      </div>
                    </td>
                    <td>
                      <div>{new Date(adm.admittedDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {new Date(adm.admittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main, #fff)' }}>
                        {adm.admittingDiagnosis || 'Under Observation'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>
                        {adm.attendingDoctor || 'Dr. Sarah Chen'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={adm.status === 'ADMITTED' ? 'emerald' : 'blue'}>
                        {adm.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/app/nurse/patients/${adm.patientId}`)}
                      >
                        EMR <ChevronRight size={14} />
                      </Button>
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

export default NurseAdmissionsPage;
