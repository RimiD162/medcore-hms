import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  User,
  CalendarDays,
  List,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, Badge, DataTable, Tabs, Modal, ConfirmationDialog, Input, FormField, Select } from '../../components/ui';

export const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { onShowToast } = useOutletContext() || {};

  const currentView = searchParams.get('view') || 'today';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await doctorApi.getAppointments({
        view: currentView,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setAppointments(res.data.appointments || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
  }, [currentView, statusFilter, searchQuery]);

  // Handle status transitions
  const handleStatusChange = async (apt, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setSelectedAppointment(apt);
      setCancelReason('');
      setCancelModalOpen(true);
      return;
    }

    try {
      await doctorApi.updateAppointmentStatus(apt.id, newStatus);
      if (onShowToast) onShowToast(`Appointment #${apt.appointmentNumber} updated to ${newStatus}`);
      fetchAppointments(pagination.page);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Status transition failed');
    }
  };

  // Confirm cancel
  const handleConfirmCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 3) {
      if (onShowToast) onShowToast('Please provide a valid cancellation reason (min 3 characters)');
      return;
    }

    setActionLoading(true);
    try {
      await doctorApi.updateAppointmentStatus(selectedAppointment.id, 'CANCELLED', cancelReason);
      if (onShowToast) onShowToast(`Appointment #${selectedAppointment.appointmentNumber} cancelled`);
      setCancelModalOpen(false);
      fetchAppointments(pagination.page);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      if (onShowToast) onShowToast('Please specify both date and time to reschedule');
      return;
    }

    setActionLoading(true);
    try {
      await doctorApi.rescheduleAppointment(selectedAppointment.id, rescheduleDate, rescheduleTime);
      if (onShowToast) onShowToast(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      setRescheduleModalOpen(false);
      fetchAppointments(pagination.page);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle check in
  const handleToggleCheckIn = async (apt) => {
    try {
      await doctorApi.toggleCheckIn(apt.id, !apt.isCheckedIn);
      if (onShowToast) {
        onShowToast(
          apt.isCheckedIn
            ? `${apt.patient.fullName} removed from waiting queue`
            : `${apt.patient.fullName} checked in to waiting queue`
        );
      }
      fetchAppointments(pagination.page);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Check-in update failed');
    }
  };

  const columns = [
    {
      title: 'Time & Status',
      key: 'time',
      render: (_, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--portal-text-title, #0f172a)' }}>
            <Clock size={14} color="#00a88f" />
            <span>{row.appointmentTime}</span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Badge status={row.status} size="sm" />
            {row.isCheckedIn && (
              <span className="med-waiting-pill">
                <span className="med-waiting-dot" /> Waiting
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Appointment #',
      dataIndex: 'appointmentNumber',
      render: (val) => <span style={{ fontWeight: 600, color: '#008c77' }}>{val}</span>,
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
            {row.patient.patientIdNumber} &bull; {row.patient.gender}, {row.patient.age}y ({row.patient.bloodGroup})
          </div>
          {row.patient.allergies && row.patient.allergies.length > 0 && (
            <div className="med-allergy-micro-tag">
              ⚠️ Allergies: {row.patient.allergies.join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Type & Reason',
      key: 'reason',
      render: (_, row) => (
        <div>
          <span className="med-type-pill">{row.type}</span>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', maxWidth: '240px' }}>
            {row.reason || 'General Consultation'}
          </p>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => {
        const canStartConsultation = ['SCHEDULED', 'CONFIRMED'].includes(row.status);
        const isScheduled = row.status === 'SCHEDULED';
        const isConfirmed = row.status === 'CONFIRMED';
        const isCompleted = row.status === 'COMPLETED';

        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
            {isScheduled && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(row, 'CONFIRMED')}
              >
                Confirm
              </Button>
            )}

            {canStartConsultation && (
              <Button
                size="sm"
                variant="primary"
                icon={Stethoscope}
                onClick={() => navigate(`/app/doctor/consultations/${row.id}`)}
              >
                Consult
              </Button>
            )}

            {canStartConsultation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleCheckIn(row)}
                title="Toggle checked in / waiting status"
              >
                {row.isCheckedIn ? 'Checked In' : 'Check In'}
              </Button>
            )}

            {canStartConsultation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedAppointment(row);
                  setRescheduleDate(new Date(row.appointmentDate).toISOString().split('T')[0]);
                  setRescheduleTime(row.appointmentTime);
                  setRescheduleModalOpen(true);
                }}
              >
                Reschedule
              </Button>
            )}

            {canStartConsultation && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleStatusChange(row, 'CANCELLED')}
              >
                Cancel
              </Button>
            )}

            {isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/app/doctor/consultations/${row.id}`)}
              >
                View EMR
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="med-appointments-page">
      {/* 1. Top Header Bar & View Tabs */}
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Appointment Management</h1>
          <p className="med-page-subtitle">
            Manage patient consultation queues, schedule transitions, and check-ins
          </p>
        </div>
      </div>

      {/* 2. Navigation Tabs for Views */}
      <Tabs
        items={[
          { key: 'today', label: "Today's Schedule", icon: Clock },
          { key: 'upcoming', label: 'Upcoming Appointments', icon: Calendar },
          { key: 'past', label: 'Past Consultations', icon: CalendarDays },
          { key: 'all', label: 'All Records', icon: List },
        ]}
        activeKey={currentView}
        onChange={(key) => {
          setSearchParams({ view: key });
        }}
        variant="pills"
        className="med-mb-4"
      />

      {/* 3. Filter and Search Controls */}
      <Card padding="compact" className="med-mb-4">
        <div className="med-controls-row">
          <div className="med-search-input-wrap">
            <Search size={16} className="med-search-icon" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, phone, appointment #..."
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
              className="med-status-select"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-Show</option>
            </Select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchAppointments(pagination.page)}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Appointments Data Table */}
      <Card padding="none">
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchAppointments(p)}
          emptyMessage={`No appointments found for '${currentView}' view.`}
        />
      </Card>

      {/* 5. Cancel Appointment Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
        subtitle={`Appointment #${selectedAppointment?.appointmentNumber} for ${selectedAppointment?.patient.fullName}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              loading={actionLoading}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.9rem', color: '#475569' }}>
            Please record the clinical or patient reason for cancelling this appointment. This reason will be logged in the patient's EMR.
          </p>
          <FormField label="Cancellation Reason" required>
            <Input
              type="text"
              placeholder="e.g. Patient requested reschedule due to illness / Doctor in emergency surgery"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </FormField>
        </div>
      </Modal>

      {/* 6. Reschedule Appointment Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        subtitle={`Rescheduling appointment for ${selectedAppointment?.patient.fullName}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReschedule}
              loading={actionLoading}
            >
              Save New Schedule
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="New Appointment Date" required>
            <Input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
            />
          </FormField>
          <FormField label="New Consultation Time Slot" required>
            <Input
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              required
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorAppointmentsPage;
