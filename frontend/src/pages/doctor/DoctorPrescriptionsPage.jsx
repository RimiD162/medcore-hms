import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  Search,
  Plus,
  Printer,
  User,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, DataTable, Input, Select, Badge, Modal, FormField, Textarea } from '../../components/ui';

export const DoctorPrescriptionsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxItems, setRxItems] = useState([
    { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 Days', route: 'Oral', instructions: 'After food' },
  ]);
  const [createLoading, setCreateLoading] = useState(false);

  // Print / View Modal
  const [viewRx, setViewRx] = useState(null);

  const fetchPrescriptions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getPrescriptions({
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setPrescriptions(res.data.prescriptions || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsList = async () => {
    try {
      const res = await doctorApi.getPatients({ limit: 50 });
      if (res.data) {
        setPatients(res.data.patients || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPrescriptions(1);
    loadPatientsList();
  }, [searchQuery]);

  const handleAddItem = () => {
    setRxItems([
      ...rxItems,
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 Days', route: 'Oral', instructions: 'After food' },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (rxItems.length > 1) {
      setRxItems(rxItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...rxItems];
    updated[index][field] = value;
    setRxItems(updated);
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatientId) {
      if (onShowToast) onShowToast('Please select a patient');
      return;
    }

    const validItems = rxItems.filter((i) => i.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      if (onShowToast) onShowToast('Please add at least one valid medication item');
      return;
    }

    setCreateLoading(true);
    try {
      await doctorApi.createPrescription({
        patientId: selectedPatientId,
        notes: rxNotes,
        items: validItems,
      });
      if (onShowToast) onShowToast('Prescription generated successfully');
      setCreateModalOpen(false);
      setRxNotes('');
      setRxItems([
        { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 Days', route: 'Oral', instructions: 'After food' },
      ]);
      fetchPrescriptions(1);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to generate prescription');
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Rx # & Date',
      key: 'rxNum',
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 700, color: '#008c77' }}>{row.prescriptionNumber}</span>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {new Date(row.prescribedDate).toLocaleDateString()}
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
            {row.patient.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {row.patient.patientIdNumber} &bull; {row.patient.age}y ({row.patient.gender})
          </div>
        </div>
      ),
    },
    {
      title: 'Prescribed Medications',
      key: 'items',
      render: (_, row) => (
        <div className="med-rx-summary-pills">
          {row.items?.slice(0, 3).map((item, idx) => (
            <span key={idx} className="med-rx-pill-item">
              {item.medicineName} ({item.dosage})
            </span>
          ))}
          {row.items?.length > 3 && (
            <span className="med-rx-pill-more">+{row.items.length - 3} more</span>
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
            variant="outline"
            icon={Printer}
            onClick={() => setViewRx(row)}
          >
            View / Print
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="med-prescriptions-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Electronic Prescriptions (e-Rx)</h1>
          <p className="med-page-subtitle">
            Generate digital prescriptions, manage dosages, schedules, and print official hospital medication orders
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          New Prescription
        </Button>
      </div>

      {/* Search & Filter */}
      <Card padding="compact" className="med-mb-4">
        <div className="med-controls-row">
          <div className="med-search-input-wrap">
            <Search size={16} className="med-search-icon" />
            <input
              type="text"
              placeholder="Search by Rx number, patient name, medication name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="med-search-field"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchPrescriptions(pagination.page)}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Prescriptions Data Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={prescriptions}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchPrescriptions(p)}
          emptyMessage="No prescriptions generated yet."
        />
      </Card>

      {/* Create Prescription Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        size="lg"
        title="Generate New Electronic Prescription"
        subtitle="Create an official MedCore hospital medication order"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              onClick={handleCreatePrescription}
              loading={createLoading}
            >
              Issue Prescription
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
                  {p.fullName} ({p.patientIdNumber}) - {p.age}y/{p.gender}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="med-form-section">
            <div className="med-section-header-row">
              <span className="med-form-label" style={{ marginBottom: 0 }}>Medications List</span>
              <Button size="sm" variant="outline" icon={Plus} onClick={handleAddItem}>
                Add Medicine
              </Button>
            </div>

            <div className="med-prescription-builder-table">
              {rxItems.map((item, index) => (
                <div key={index} className="med-rx-builder-row">
                  <div className="med-rx-field-med">
                    <Input
                      type="text"
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={item.medicineName}
                      onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                    />
                  </div>
                  <div className="med-rx-field-sm">
                    <Input
                      type="text"
                      placeholder="Dosage (500mg)"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div className="med-rx-field-sm">
                    <Input
                      type="text"
                      placeholder="Frequency (1-0-1)"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                    />
                  </div>
                  <div className="med-rx-field-sm">
                    <Input
                      type="text"
                      placeholder="Duration (5 Days)"
                      value={item.duration}
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                    />
                  </div>
                  <div className="med-rx-field-instr">
                    <Input
                      type="text"
                      placeholder="Instructions (After food)"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                    />
                  </div>
                  {rxItems.length > 1 && (
                    <button
                      type="button"
                      className="med-rx-remove-btn"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <FormField label="Doctor's General Instructions">
            <Textarea
              rows={2}
              placeholder="e.g. Drink plenty of warm water, review in 7 days if symptoms persist."
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* Print-Friendly Prescription Modal */}
      {viewRx && (
        <Modal
          isOpen={!!viewRx}
          onClose={() => setViewRx(null)}
          size="lg"
          title="Electronic Prescription Order"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="outline" onClick={() => setViewRx(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Prescription
              </Button>
            </div>
          }
        >
          <div className="med-print-rx-layout" id="printable-prescription">
            {/* Hospital & Doctor Header */}
            <div className="med-print-header">
              <div className="med-print-hospital-info">
                <h3>MedCore Central Hospital</h3>
                <p>742 Healthcare Boulevard &bull; Ph: +91 98765 43210</p>
              </div>
              <div className="med-print-rx-badge">
                <span className="med-rx-title-code">{viewRx.prescriptionNumber}</span>
                <span className="med-rx-date-print">
                  Date: {new Date(viewRx.prescribedDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="med-print-divider" />

            {/* Patient Header */}
            <div className="med-print-patient-row">
              <div>
                <strong>Patient:</strong> {viewRx.patient?.fullName}
              </div>
              <div>
                <strong>MRN:</strong> {viewRx.patient?.patientIdNumber}
              </div>
              <div>
                <strong>Age/Gender:</strong> {viewRx.patient?.age}y / {viewRx.patient?.gender}
              </div>
            </div>

            <div className="med-print-rx-symbol">&#8478;</div>

            {/* Medicine Items Table */}
            <table className="med-print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Schedule</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {viewRx.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{it.medicineName}</td>
                    <td>{it.dosage}</td>
                    <td>{it.frequency}</td>
                    <td>{it.duration}</td>
                    <td>{it.instructions || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viewRx.notes && (
              <div className="med-print-notes">
                <strong>Advice / Notes:</strong> {viewRx.notes}
              </div>
            )}

            <div className="med-print-footer-signature">
              <div className="med-signature-line" />
              <span>Attending Physician Signature</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorPrescriptionsPage;
