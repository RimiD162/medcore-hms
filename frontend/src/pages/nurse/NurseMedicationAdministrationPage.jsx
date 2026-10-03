import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  BedDouble,
  User,
  Calendar,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, Modal, InputField, SelectField, TextareaField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseMedicationAdministrationPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [actionTask, setActionTask] = useState(null);
  const [actionType, setActionType] = useState('ADMINISTER'); // ADMINISTER, HOLD, MISS
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch e-MAR Tasks
  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getMedicationTasks({ status: statusFilter || undefined, patientId: selectedPatientId || undefined }),
    [statusFilter, selectedPatientId]
  );

  // Fetch Assigned Patients for filter
  const { data: patientsData } = useNurseData(nurseApi.getAssignedPatients);
  const patientsList = patientsData?.patients || [];

  const tasksList = data?.tasks || [];

  const handleOpenAction = (task, type) => {
    setActionTask(task);
    setActionType(type);
    setReason('');
    setNotes('');
  };

  const handleConfirmAction = async () => {
    if (!actionTask) return;
    try {
      setSubmitting(true);
      if (actionType === 'ADMINISTER') {
        await nurseApi.administerMedication(actionTask.id, { notes });
        if (onShowToast) onShowToast(`Administered ${actionTask.medicineName} for ${actionTask.patient?.fullName}`);
      } else if (actionType === 'HOLD') {
        if (!reason) {
          if (onShowToast) onShowToast('A clinical reason is mandatory to hold medication');
          return;
        }
        await nurseApi.holdMedication(actionTask.id, { reason, notes });
        if (onShowToast) onShowToast(`Marked ${actionTask.medicineName} as HELD`);
      } else if (actionType === 'MISS') {
        if (!reason) {
          if (onShowToast) onShowToast('A clinical reason is mandatory to mark medication as missed');
          return;
        }
        await nurseApi.missMedication(actionTask.id, { reason, notes });
        if (onShowToast) onShowToast(`Marked ${actionTask.medicineName} as MISSED`);
      }
      setActionTask(null);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pill size={24} color="#00d2b4" />
            Electronic Medication Administration Record (e-MAR)
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Scheduled medication administration rounds, dose verification, and hold/miss logging
          </p>
        </div>

        <Badge variant="teal" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
          <Clock size={14} style={{ marginRight: '6px' }} /> Active Medication Round
        </Badge>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ minWidth: '220px' }}>
              <SelectField
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                options={[
                  { value: '', label: 'All Assigned Patients' },
                  ...patientsList.map((p) => ({ value: p.id, label: `${p.fullName} (${p.patientIdNumber})` })),
                ]}
                style={{ margin: 0 }}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <SelectField
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Administration Statuses' },
                  { value: 'SCHEDULED', label: 'Scheduled / Due' },
                  { value: 'ADMINISTERED', label: 'Administered' },
                  { value: 'HELD', label: 'Held' },
                  { value: 'MISSED', label: 'Missed' },
                ]}
                style={{ margin: 0 }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
            Showing <strong>{tasksList.length}</strong> medication tasks
          </div>
        </div>
      </Card>

      {/* e-MAR Schedule Table */}
      <Card>
        {loading ? (
          <LoadingState message="Loading e-MAR administration tasks..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : tasksList.length === 0 ? (
          <EmptyState
            title="No medication tasks found"
            description="No scheduled or administered doses matching your filters."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table">
              <thead>
                <tr>
                  <th>Scheduled Time</th>
                  <th>Patient Details</th>
                  <th>Medication & Dosage</th>
                  <th>Route / Frequency</th>
                  <th>Status</th>
                  <th>Administered Time & Signer</th>
                  <th>Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasksList.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#fff' }}>
                        {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {new Date(task.scheduledAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                        {task.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {task.patient?.patientIdNumber} &bull; {task.patient?.admissions?.[0]?.bedNumber || 'Bed 1'}
                      </div>
                      {task.patient?.allergies && task.patient.allergies.length > 0 && (
                        <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldAlert size={11} /> Allergy: {task.patient.allergies.join(', ')}
                        </div>
                      )}
                    </td>

                    <td>
                      <strong style={{ fontSize: '0.92rem', color: '#00d2b4' }}>{task.medicineName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Dosage: {task.dosage}
                      </div>
                    </td>

                    <td>
                      <Badge variant="blue">{task.route}</Badge>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        {task.frequency || 'Scheduled'}
                      </div>
                    </td>

                    <td>
                      <Badge
                        variant={
                          task.status === 'ADMINISTERED'
                            ? 'emerald'
                            : task.status === 'DUE'
                            ? 'amber'
                            : task.status === 'HELD'
                            ? 'purple'
                            : task.status === 'MISSED'
                            ? 'rose'
                            : 'teal'
                        }
                      >
                        {task.status}
                      </Badge>
                      {task.reason && (
                        <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '3px' }}>
                          {task.reason}
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: '0.8rem' }}>
                      {task.administeredAt ? (
                        <>
                          <div style={{ color: '#34d399', fontWeight: '700' }}>
                            {new Date(task.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ color: 'var(--text-muted, #94a3b8)' }}>
                            Signed by: {task.nurse?.user?.fullName || 'Duty Nurse'}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Pending</span>
                      )}
                    </td>

                    <td>
                      {['SCHEDULED', 'DUE'].includes(task.status) ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenAction(task, 'ADMINISTER')}
                          >
                            Administer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAction(task, 'HOLD')}
                          >
                            Hold
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenAction(task, 'MISS')}
                          >
                            Miss
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Finalized
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action Modal */}
      {actionTask && (
        <Modal
          isOpen={!!actionTask}
          onClose={() => setActionTask(null)}
          title={`e-MAR Round: ${actionType} ${actionTask.medicineName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))', fontSize: '0.88rem' }}>
              <div>Patient: <strong style={{ color: '#fff' }}>{actionTask.patient?.fullName}</strong> ({actionTask.patient?.patientIdNumber})</div>
              <div>Medication: <strong style={{ color: '#00d2b4' }}>{actionTask.medicineName} {actionTask.dosage}</strong> ({actionTask.route})</div>
            </div>

            {['HOLD', 'MISS'].includes(actionType) && (
              <InputField
                label={`Mandatory Clinical Reason to ${actionType === 'HOLD' ? 'Hold' : 'Mark Missed'}`}
                placeholder="e.g. Patient NPO for scheduled surgery / Undergoing CT scan / Hypotensive..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            )}

            <TextareaField
              label="Nursing Remarks / Notes"
              placeholder="Any clinical observations or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setActionTask(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={actionType === 'ADMINISTER' ? 'primary' : 'outline'}
                onClick={handleConfirmAction}
                disabled={submitting}
              >
                {submitting ? 'Confirming...' : `Confirm ${actionType}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NurseMedicationAdministrationPage;
