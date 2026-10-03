import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Power,
  RefreshCw,
} from 'lucide-react';
import { doctorApi } from '../../api/doctorApi';
import {
  Card,
  Button,
  Badge,
  Modal,
  ConfirmationDialog,
  FormField,
  Input,
  Select,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/ui';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export const DoctorAvailabilityPage = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '13:00',
    slotDurationMinutes: 20,
    maxPatients: 10,
    isActive: true,
  });

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorApi.getAvailability();
      const list = res.data?.data || res.data || [];
      setAvailabilities(list);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError(err.response?.data?.message || 'Failed to load weekly schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = (defaultDay = 'MONDAY') => {
    setEditingSlot(null);
    setFormData({
      dayOfWeek: defaultDay,
      startTime: '09:00',
      endTime: '13:00',
      slotDurationMinutes: 20,
      maxPatients: 10,
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDurationMinutes: slot.slotDurationMinutes || 20,
      maxPatients: slot.maxPatients || 10,
      isActive: slot.isActive !== false,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (formData.startTime >= formData.endTime) {
      setFormError('Start time must be strictly before end time.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        slotDurationMinutes: parseInt(formData.slotDurationMinutes, 10),
        maxPatients: parseInt(formData.maxPatients, 10),
        isActive: formData.isActive,
      };

      if (editingSlot) {
        await doctorApi.updateAvailability(editingSlot.id, payload);
        showToast('Schedule slot updated successfully.');
      } else {
        await doctorApi.createAvailability(payload);
        showToast('New schedule slot added.');
      }

      setIsModalOpen(false);
      fetchAvailability();
    } catch (err) {
      console.error('Failed to save slot:', err);
      setFormError(err.response?.data?.message || 'Failed to save slot. Check for overlapping hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      await doctorApi.updateAvailability(slot.id, {
        isActive: !slot.isActive,
      });
      showToast(`Slot marked as ${!slot.isActive ? 'Active' : 'Inactive'}.`);
      fetchAvailability();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      alert(err.response?.data?.message || 'Failed to update slot status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await doctorApi.deleteAvailability(deleteId);
      showToast('Schedule slot removed.');
      setDeleteId(null);
      fetchAvailability();
    } catch (err) {
      console.error('Failed to delete slot:', err);
      alert(err.response?.data?.message || 'Failed to delete schedule slot.');
    } finally {
      setDeleting(false);
    }
  };

  // Group by day of week
  const groupedSlots = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = availabilities
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const totalSlots = availabilities.length;
  const activeSlots = availabilities.filter((s) => s.isActive).length;
  const activeDaysCount = Object.keys(groupedSlots).filter((d) => groupedSlots[d].some((s) => s.isActive)).length;
  const totalWeeklyCapacity = availabilities.reduce((sum, s) => s.isActive ? sum + (s.maxPatients || 0) : sum, 0);

  if (loading) return <LoadingState message="Loading weekly schedule & clinic hours..." />;
  if (error) return <ErrorState title="Schedule Error" message={error} onRetry={fetchAvailability} />;

  return (
    <div className="med-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="med-floating-toast">
          <CheckCircle2 size={18} color="#00d2b4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Weekly Schedule & Availability</h1>
          <p className="med-page-subtitle">
            Configure your clinic consultation days, OPD hours, and patient slots for booking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchAvailability}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => handleOpenAddModal('MONDAY')}>
            Add New Slot
          </Button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="med-stat-card" style={{ padding: '16px' }}>
          <div className="med-stat-label">Active Working Days</div>
          <div className="med-stat-value" style={{ fontSize: '1.6rem' }}>{activeDaysCount} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--portal-text-muted, #64748b)' }}>/ 7 days</span></div>
        </div>

        <div className="med-stat-card" style={{ padding: '16px' }}>
          <div className="med-stat-label">Total Time Slots</div>
          <div className="med-stat-value" style={{ fontSize: '1.6rem' }}>{activeSlots} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--portal-text-muted, #64748b)' }}>active ({totalSlots} total)</span></div>
        </div>

        <div className="med-stat-card" style={{ padding: '16px' }}>
          <div className="med-stat-label">Weekly Max Capacity</div>
          <div className="med-stat-value" style={{ fontSize: '1.6rem' }}>{totalWeeklyCapacity} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--portal-text-muted, #64748b)' }}>patients</span></div>
        </div>

        <div className="med-stat-card" style={{ padding: '16px' }}>
          <div className="med-stat-label">Booking Mode</div>
          <div className="med-stat-value" style={{ fontSize: '1.2rem', color: 'var(--primary-teal, #00a88f)', display: 'flex', alignItems: 'center', height: '100%' }}>
            Auto-Slot Scheduling
          </div>
        </div>
      </div>

      {/* Weekly Schedule Days Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {DAYS_OF_WEEK.map((day) => {
          const slots = groupedSlots[day];
          const hasActiveSlots = slots.some((s) => s.isActive);

          return (
            <Card
              key={day}
              className={`med-day-card ${hasActiveSlots ? 'med-day-active' : 'med-day-off'}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: hasActiveSlots ? 'rgba(0, 168, 143, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                      color: hasActiveSlots ? '#00a88f' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{DAY_LABELS[day]}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted, #64748b)' }}>
                      {slots.length} slot{slots.length !== 1 ? 's' : ''} configured
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenAddModal(day)}
                >
                  Add Slot
                </Button>
              </div>

              {slots.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', background: 'var(--portal-bg-hover, #f8fafc)', borderRadius: '8px', border: '1px dashed var(--portal-border-subtle, #e2e8f0)', color: 'var(--portal-text-muted, #64748b)', fontSize: '0.86rem' }}>
                  No clinic hours scheduled for {DAY_LABELS[day]}.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--portal-border-subtle, #e2e8f0)',
                        backgroundColor: slot.isActive ? 'var(--portal-card-bg, #ffffff)' : 'var(--portal-bg-hover, #f8fafc)',
                        opacity: slot.isActive ? 1 : 0.75,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--portal-text-heading, #0f172a)', fontSize: '0.96rem' }}>
                          <Clock size={16} color="#00a88f" />
                          <span>{slot.startTime} — {slot.endTime}</span>
                        </div>
                        <Badge variant={slot.isActive ? 'success' : 'default'} size="sm">
                          {slot.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--portal-text-muted, #64748b)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={14} />
                          <span>Max {slot.maxPatients} patients</span>
                        </div>
                        <div>
                          <span>{slot.slotDurationMinutes} min / patient</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--portal-border-subtle, #e2e8f0)', paddingTop: '10px', marginTop: '2px' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Power}
                          onClick={() => handleToggleActive(slot)}
                          title={slot.isActive ? 'Pause Slot' : 'Activate Slot'}
                        >
                          {slot.isActive ? 'Pause' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEditModal(slot)}
                          title="Edit Slot"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteId(slot.id)}
                          title="Delete Slot"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'Edit Schedule Slot' : 'Add Weekly Schedule Slot'}
        subtitle="Configure the day, start & end time, and maximum patient quota."
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSlot} loading={saving}>
              {editingSlot ? 'Save Changes' : 'Create Slot'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.88rem' }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <FormField label="Day of Week" required>
            <Select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleFormChange}
              options={DAYS_OF_WEEK.map((d) => ({ value: d, label: DAY_LABELS[d] }))}
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Start Time (24h)" required>
              <Input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleFormChange}
                required
              />
            </FormField>

            <FormField label="End Time (24h)" required>
              <Input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleFormChange}
                required
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Slot Duration (Minutes)">
              <Select
                name="slotDurationMinutes"
                value={formData.slotDurationMinutes}
                onChange={handleFormChange}
                options={[
                  { value: 10, label: '10 Minutes' },
                  { value: 15, label: '15 Minutes' },
                  { value: 20, label: '20 Minutes (Standard)' },
                  { value: 30, label: '30 Minutes' },
                  { value: 45, label: '45 Minutes' },
                  { value: 60, label: '60 Minutes' },
                ]}
              />
            </FormField>

            <FormField label="Max Patient Quota">
              <Input
                type="number"
                name="maxPatients"
                value={formData.maxPatients}
                onChange={handleFormChange}
                min="1"
                max="100"
                required
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleFormChange}
              style={{ width: '18px', height: '18px', accentColor: '#00a88f' }}
            />
            <label htmlFor="isActive" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
              Slot is actively available for online & reception booking
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule Slot"
        message="Are you sure you want to remove this schedule slot? Existing booked appointments will not be deleted, but new bookings will no longer be available during this time."
        confirmText="Delete Slot"
        loading={deleting}
      />
    </div>
  );
};

export default DoctorAvailabilityPage;
