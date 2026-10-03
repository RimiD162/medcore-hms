import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  User,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, DataTable, Input, Select, Badge, Modal } from '../../components/ui';

export const DoctorMedicalRecordsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getMedicalRecords({
        search: searchQuery || undefined,
        recordType: recordTypeFilter || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [searchQuery, recordTypeFilter]);

  const columns = [
    {
      title: 'Record # & Date',
      key: 'recordNum',
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 700, color: '#008c77' }}>{row.recordNumber}</span>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {new Date(row.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Patient Name & MRN',
      key: 'patient',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--portal-text-title, #0f172a)' }}>
            {row.patient.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {row.patient.patientIdNumber} &bull; {row.patient.gender}, {row.patient.age}y
          </div>
        </div>
      ),
    },
    {
      title: 'Clinical Title & Assessment',
      key: 'title',
      render: (_, row) => (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
            Diagnosis: <strong>{row.diagnosis || 'Clinical Review'}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'recordType',
      render: (val) => <span className="med-type-pill">{val}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={() => setSelectedRecord(row)}
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/app/doctor/patients/${row.patientId}`)}
          >
            Patient EMR
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="med-records-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Electronic Medical Records</h1>
          <p className="med-page-subtitle">
            Search, review clinical summaries, diagnoses, and chronological patient medical records
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
              placeholder="Search by record #, patient name, MRN, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="med-search-field"
            />
          </div>

          <div className="med-filter-group">
            <Select
              value={recordTypeFilter}
              onChange={(e) => setRecordTypeFilter(e.target.value)}
              placeholder="All Record Types"
            >
              <option value="Consultation Record">Consultation Record</option>
              <option value="Cardiology Review">Cardiology Review</option>
              <option value="Pulmonology Review">Pulmonology Review</option>
              <option value="Endocrinology Review">Endocrinology Review</option>
              <option value="Surgical Follow-up">Surgical Follow-up</option>
              <option value="General OPD">General OPD</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchRecords(pagination.page)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Records Data Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchRecords(p)}
          emptyMessage="No medical records found."
        />
      </Card>

      {/* Medical Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Medical Record: ${selectedRecord.recordNumber}`}
          subtitle={`${selectedRecord.patient.fullName} (${selectedRecord.patient.patientIdNumber})`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="med-record-modal-body">
            <div className="med-info-grid med-mb-4">
              <div className="med-info-item">
                <span className="med-info-label">Record Date</span>
                <span className="med-info-value">
                  {new Date(selectedRecord.recordDate).toLocaleDateString()}
                </span>
              </div>
              <div className="med-info-item">
                <span className="med-info-label">Record Type</span>
                <span className="med-info-value">{selectedRecord.recordType}</span>
              </div>
            </div>

            <div className="med-modal-section">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                {selectedRecord.title}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#008c77', fontWeight: 600 }}>
                Diagnosis: {selectedRecord.diagnosis}
              </p>
            </div>

            {selectedRecord.summary && (
              <div className="med-modal-section">
                <span className="med-info-label">Clinical Summary</span>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {selectedRecord.summary}
                </p>
              </div>
            )}

            {selectedRecord.notes && (
              <div className="med-modal-section">
                <span className="med-info-label">Physician Notes</span>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {selectedRecord.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorMedicalRecordsPage;
