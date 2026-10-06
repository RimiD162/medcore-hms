import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  CalendarPlus,
  Receipt,
  Eye,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, Input, Select, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistPatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [registrationSource, setRegistrationSource] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
        search: search || undefined,
        registrationSource: registrationSource !== 'ALL' ? registrationSource : undefined,
      };
      const res = await receptionistApi.getPatients(params);
      const data = res.data || res;
      setPatients(data.patients || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 15 });
    } catch (err) {
      setError(err.message || 'Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, registrationSource, page]);

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#00d2b4" /> Patient Directory
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Search registered hospital patients, check demographic files, and initiate bookings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchPatients}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/receptionist/patients/register')}>
            <UserPlus size={14} style={{ marginRight: '6px' }} /> Register New Patient
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Name, Patient ID or Phone
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="e.g. Eleanor, MC-2026-000101, 98450..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Registration Source
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={registrationSource}
              onChange={(e) => {
                setRegistrationSource(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Sources</option>
              <option value="Standard">Standard Intake</option>
              <option value="Emergency">Emergency</option>
              <option value="Walk-In">Walk-In</option>
              <option value="Referral">Referral</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Patients Table */}
      {loading ? (
        <LoadingState message="Loading patient directory records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPatients} />
      ) : patients.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Patients Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              No patient records match the specified search filters.
            </p>
            <Button
              variant="primary"
              size="sm"
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/app/receptionist/patients/register')}
            >
              <UserPlus size={14} style={{ marginRight: '6px' }} /> Register Patient Now
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Patient ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Patient Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Demographics</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Contact Info</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Blood</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Source</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#00d2b4', fontSize: '0.88rem' }}>
                      {patient.patientIdNumber}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                        {patient.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Registered: {new Date(patient.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem' }}>
                      {patient.gender || 'Unknown'} {patient.age ? `• ${patient.age} yrs` : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-main, #f8fafc)' }}>{patient.phone}</div>
                      {patient.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{patient.email}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant={patient.bloodGroup ? 'teal' : 'gray'}>
                        {patient.bloodGroup || 'N/A'}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge
                        variant={
                          patient.registrationSource === 'Emergency'
                            ? 'danger'
                            : patient.registrationSource === 'Walk-In'
                            ? 'amber'
                            : 'blue'
                        }
                      >
                        {patient.registrationSource}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button
                          variant="outline"
                          size="xs"
                          title="View Demographic Profile"
                          onClick={() => navigate(`/app/receptionist/patients/${patient.id}`)}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} /> View
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          title="Book Doctor Appointment"
                          onClick={() => navigate(`/app/receptionist/appointments/book?patientId=${patient.id}`)}
                        >
                          <CalendarPlus size={13} style={{ marginRight: '4px' }} /> Book
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          title="Create Bill / Invoice"
                          onClick={() => navigate(`/app/receptionist/billing?patientId=${patient.id}`)}
                        >
                          <Receipt size={13} style={{ marginRight: '4px' }} /> Bill
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total patients)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ReceptionistPatientsPage;
