import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Microscope,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileCheck,
  RefreshCw,
  Download,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, DataTable, Input, Select, Badge, Modal, FormField, Textarea } from '../../components/ui';

export const DoctorLabReportsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Order Lab Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Clinical Pathology');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [doctorReviewNotes, setDoctorReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getLabReports({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setReports(res.data.reports || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load laboratory reports');
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await doctorApi.getPatients({ limit: 50 });
      if (res.data) setPatients(res.data.patients || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchReports(1);
    loadPatients();
  }, [statusFilter, searchQuery]);

  const handleOrderTest = async () => {
    if (!selectedPatientId || !testName.trim()) {
      if (onShowToast) onShowToast('Please select a patient and enter the test name');
      return;
    }

    setOrderLoading(true);
    try {
      await doctorApi.orderLabTest({
        patientId: selectedPatientId,
        testName,
        category,
        doctorNotes: orderNotes,
      });
      if (onShowToast) onShowToast(`Lab investigation "${testName}" ordered successfully`);
      setOrderModalOpen(false);
      setTestName('');
      setOrderNotes('');
      fetchReports(1);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to order lab test');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleReviewReport = async () => {
    if (!doctorReviewNotes.trim()) {
      if (onShowToast) onShowToast('Please enter your clinical interpretation notes');
      return;
    }

    setReviewLoading(true);
    try {
      await doctorApi.reviewLabReport(selectedReport.id, doctorReviewNotes);
      if (onShowToast) onShowToast(`Report #${selectedReport.reportNumber} reviewed and signed`);
      setReviewModalOpen(false);
      fetchReports(pagination.page);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to review lab report');
    } finally {
      setReviewLoading(false);
    }
  };

  const columns = [
    {
      title: 'Report # & Ordered Date',
      key: 'reportNum',
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 700, color: '#008c77' }}>{row.reportNumber}</span>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {new Date(row.orderedDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Patient Details',
      key: 'patient',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--portal-text-title, #0f172a)' }}>
            {row.patient?.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {row.patient?.patientIdNumber} &bull; {row.patient?.gender}, {row.patient?.age}y
          </div>
        </div>
      ),
    },
    {
      title: 'Test Name & Category',
      key: 'test',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.testName}</div>
          <span className="med-type-pill">{row.category}</span>
        </div>
      ),
    },
    {
      title: 'Status & Review',
      key: 'status',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Badge status={row.status} size="sm" />
          {row.isReviewed ? (
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Doctor Reviewed
            </span>
          ) : row.status === 'COMPLETED' ? (
            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> Awaiting Review
            </span>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {row.status === 'COMPLETED' && (
            <Button
              size="sm"
              variant={row.isReviewed ? 'outline' : 'teal'}
              icon={FileCheck}
              onClick={() => {
                setSelectedReport(row);
                setDoctorReviewNotes(row.doctorNotes || '');
                setReviewModalOpen(true);
              }}
            >
              {row.isReviewed ? 'View Review' : 'Review & Sign'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="med-lab-reports-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Laboratory & Diagnostic Reports</h1>
          <p className="med-page-subtitle">
            Track ordered investigations, sample collection progress, laboratory results, and clinical doctor reviews
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setOrderModalOpen(true)}
        >
          Order Lab Test
        </Button>
      </div>

      {/* Filter and Search */}
      <Card padding="compact" className="med-mb-4">
        <div className="med-controls-row">
          <div className="med-search-input-wrap">
            <Search size={16} className="med-search-icon" />
            <input
              type="text"
              placeholder="Search by report number, patient name, MRN, test name..."
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
              <option value="ORDERED">Ordered</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed Results</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchReports(pagination.page)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Lab Reports Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchReports(p)}
          emptyMessage="No laboratory reports found."
        />
      </Card>

      {/* Order Lab Test Modal */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Order New Diagnostic Test"
        subtitle="Submit official order to Hospital Clinical Laboratory"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleOrderTest}
              loading={orderLoading}
            >
              Submit Lab Order
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Select Patient" required>
            <Select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              placeholder="Select patient..."
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.patientIdNumber})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Test / Panel Name" required>
            <Input
              type="text"
              placeholder="e.g. Complete Blood Count (CBC) with ESR"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Diagnostic Department">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="Clinical Biochemistry">Clinical Biochemistry</option>
              <option value="Hematology">Hematology</option>
              <option value="Endocrinology & Immunology">Endocrinology & Immunology</option>
              <option value="Pulmonary Function Lab">Pulmonary Function Lab</option>
              <option value="Radiology & Imaging">Radiology & Imaging</option>
            </Select>
          </FormField>

          <FormField label="Clinical Indication / Special Instructions">
            <Textarea
              rows={2}
              placeholder="e.g. Fasting sample required, post-medication monitoring"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* Review & Interpret Lab Report Modal */}
      {selectedReport && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Clinical Interpretation: ${selectedReport.reportNumber}`}
          subtitle={`${selectedReport.testName} &bull; ${selectedReport.patient?.fullName}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="teal"
                onClick={handleReviewReport}
                loading={reviewLoading}
              >
                Sign & Save Review
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedReport.resultSummary && (
              <div className="med-lab-result-box">
                <span className="med-info-label">Report Findings & Summary</span>
                <p style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 600, marginTop: '4px' }}>
                  {selectedReport.resultSummary}
                </p>
              </div>
            )}

            {selectedReport.referenceRange && (
              <div className="med-lab-ref-range">
                Reference Range: {selectedReport.referenceRange}
              </div>
            )}

            <FormField label="Physician's Clinical Interpretation & Advice" required>
              <Textarea
                rows={3}
                placeholder="Document your clinical evaluation of these results, treatment adjustments, or follow-up orders..."
                value={doctorReviewNotes}
                onChange={(e) => setDoctorReviewNotes(e.target.value)}
                required
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorLabReportsPage;
