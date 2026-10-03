import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  User,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, DataTable, Input, Select, Badge } from '../../components/ui';

export const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchPatients = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getPatients({
        search: searchQuery || undefined,
        gender: genderFilter || undefined,
        bloodGroup: bloodGroupFilter || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setPatients(res.data.patients || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(1);
  }, [searchQuery, genderFilter, bloodGroupFilter]);

  const columns = [
    {
      title: 'Patient Name & MRN',
      key: 'name',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="med-patient-avatar-box">
            <User size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--portal-text-title, #0f172a)' }}>
              {row.fullName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#008c77', fontWeight: 600 }}>
              {row.patientIdNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Demographics',
      key: 'demographics',
      render: (_, row) => (
        <div style={{ fontSize: '0.88rem' }}>
          <span>{row.age} yrs</span> &bull; <span>{row.gender}</span> &bull; <strong style={{ color: '#0284c7' }}>{row.bloodGroup}</strong>
        </div>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      render: (val) => <span style={{ fontSize: '0.85rem', color: '#475569' }}>{val}</span>,
    },
    {
      title: 'Allergies & Conditions',
      key: 'clinical_alerts',
      render: (_, row) => (
        <div>
          {row.allergies && row.allergies.length > 0 ? (
            <span className="med-allergy-micro-tag">
              ⚠️ {row.allergies.join(', ')}
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No known allergies</span>
          )}
          {row.chronicConditions && row.chronicConditions.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              {row.chronicConditions.join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Last Visit & Next Appointment',
      key: 'visits',
      render: (_, row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>
            Last Visit:{' '}
            <strong>
              {row.lastVisit ? new Date(row.lastVisit).toLocaleDateString() : 'First Visit'}
            </strong>
          </div>
          <div style={{ color: '#008c77', marginTop: '2px' }}>
            {row.nextAppointment ? `Next: ${row.nextAppointment}` : 'No appointment scheduled'}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/app/doctor/patients/${row.id}`)}
          >
            Open EMR
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="med-patients-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Patient Electronic Medical Records (EMR)</h1>
          <p className="med-page-subtitle">
            Search, review comprehensive clinical history, previous prescriptions, and diagnostic reports
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <Card padding="compact" className="med-mb-4">
        <div className="med-controls-row">
          <div className="med-search-input-wrap">
            <Search size={16} className="med-search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, phone number, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="med-search-field"
            />
          </div>

          <div className="med-filter-group">
            <Select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              placeholder="All Genders"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              placeholder="All Blood Groups"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchPatients(pagination.page)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Patients Data Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={patients}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchPatients(p)}
          emptyMessage="No patient records found matching search filters."
          onRowClick={(row) => navigate(`/app/doctor/patients/${row.id}`)}
        />
      </Card>
    </div>
  );
};

export default DoctorPatientsPage;
