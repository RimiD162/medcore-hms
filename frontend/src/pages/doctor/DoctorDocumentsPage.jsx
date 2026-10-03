import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FolderOpen,
  Search,
  FileText,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, DataTable, Input, Select, Tabs } from '../../components/ui';

export const DoctorDocumentsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getDocuments({
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setDocuments(res.data.documents || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load clinical documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1);
  }, [categoryFilter, searchQuery]);

  const columns = [
    {
      title: 'Document Title & Category',
      key: 'title',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="med-doc-icon-wrap">
            <FileText size={20} color="#00a88f" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--portal-text-title, #0f172a)' }}>
              {row.title}
            </div>
            <span className="med-type-pill">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Patient Name & MRN',
      key: 'patient',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.patient?.fullName}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {row.patient?.patientIdNumber}
          </div>
        </div>
      ),
    },
    {
      title: 'File Size & Upload Date',
      key: 'file',
      render: (_, row) => (
        <div style={{ fontSize: '0.85rem' }}>
          <div>{row.fileSize || 'PDF Document'}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {new Date(row.uploadedAt).toLocaleDateString()}
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
            variant="outline"
            icon={Eye}
            onClick={() => onShowToast && onShowToast(`Opening secure viewer for ${row.title}`)}
          >
            View Document
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="med-documents-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Clinical Documents Archive</h1>
          <p className="med-page-subtitle">
            Secure digital repository of patient lab results, electronic prescriptions, operative notes, and consultation attachments
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        items={[
          { key: '', label: 'All Documents' },
          { key: 'Lab Reports', label: 'Laboratory Reports' },
          { key: 'Prescriptions', label: 'Prescription Orders' },
          { key: 'Medical Documents', label: 'Medical Records' },
          { key: 'Consultation Documents', label: 'Consultation Notes' },
        ]}
        activeKey={categoryFilter}
        onChange={setCategoryFilter}
        variant="pills"
        className="med-mb-4"
      />

      {/* Search & Refresh */}
      <Card padding="compact" className="med-mb-4">
        <div className="med-controls-row">
          <div className="med-search-input-wrap">
            <Search size={16} className="med-search-icon" />
            <input
              type="text"
              placeholder="Search documents by title, patient name, or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="med-search-field"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchDocuments(pagination.page)}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Documents Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={documents}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchDocuments(p)}
          emptyMessage="No clinical documents found."
        />
      </Card>
    </div>
  );
};

export default DoctorDocumentsPage;
