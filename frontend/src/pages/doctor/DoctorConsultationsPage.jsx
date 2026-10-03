import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Stethoscope,
  Clock,
  User,
  Plus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, Badge, DataTable, Input, Select } from '../../components/ui';

export const DoctorConsultationsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('DRAFT');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchConsultations = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getConsultations({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setConsultations(res.data.consultations || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations(1);
  }, [statusFilter, searchQuery]);

  const columns = [
    {
      title: 'Patient & MRN',
      key: 'patient',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--portal-text-title, #0f172a)' }}>
            {row.patient?.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#008c77', fontWeight: 600 }}>
            {row.patient?.patientIdNumber} &bull; {row.patient?.gender}, {row.patient?.age}y
          </div>
        </div>
      ),
    },
    {
      title: 'Appointment Info',
      key: 'appointment',
      render: (_, row) => (
        <div style={{ fontSize: '0.85rem' }}>
          <div>
            <strong>{row.appointment?.appointmentNumber}</strong>
          </div>
          <div style={{ color: '#64748b' }}>
            {new Date(row.appointment?.appointmentDate).toLocaleDateString()} at {row.appointment?.appointmentTime}
          </div>
        </div>
      ),
    },
    {
      title: 'Chief Complaint & Symptoms',
      key: 'complaint',
      render: (_, row) => (
        <div style={{ maxWidth: '280px' }}>
          <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
            {row.chiefComplaint || 'Pending assessment'}
          </p>
          {row.symptoms && row.symptoms.length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Symptoms: {row.symptoms.join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (val) => <Badge status={val} size="sm" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            size="sm"
            variant={row.status === 'DRAFT' ? 'primary' : 'outline'}
            icon={Stethoscope}
            onClick={() => navigate(`/app/doctor/consultations/${row.appointmentId}`)}
          >
            {row.status === 'DRAFT' ? 'Resume Consultation' : 'View Summary'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="med-consultations-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Clinical Consultations Hub</h1>
          <p className="med-page-subtitle">
            Active physician consultation sessions, drafts, and completed medical evaluations
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
              placeholder="Search by patient name, MRN, appointment #, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="med-search-field"
            />
          </div>

          <div className="med-filter-group">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
            >
              <option value="DRAFT">Active Drafts</option>
              <option value="COMPLETED">Completed</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchConsultations(pagination.page)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Consultations Data Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={consultations}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchConsultations(p)}
          emptyMessage="No consultations found."
        />
      </Card>
    </div>
  );
};

export default DoctorConsultationsPage;
