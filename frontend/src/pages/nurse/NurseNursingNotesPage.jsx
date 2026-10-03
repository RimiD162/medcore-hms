import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, Modal, InputField, SelectField, TextareaField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseNursingNotesPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isFlaggedFilter, setIsFlaggedFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    patientId: '',
    shift: 'Morning Shift (07:00 - 15:00)',
    observation: '',
    careProvided: '',
    patientResponse: '',
    additionalNotes: '',
    isFlagged: false,
  });

  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getNotes({ search, patientId: selectedPatientId || undefined, isFlagged: isFlaggedFilter }),
    [search, selectedPatientId, isFlaggedFilter]
  );

  const { data: patientsData } = useNurseData(nurseApi.getAssignedPatients);
  const patientsList = patientsData?.patients || [];

  const notesList = data?.notes || [];

  const handleOpenModal = () => {
    setForm({
      patientId: selectedPatientId || (patientsList[0]?.id || ''),
      shift: 'Morning Shift (07:00 - 15:00)',
      observation: '',
      careProvided: '',
      patientResponse: '',
      additionalNotes: '',
      isFlagged: false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await nurseApi.createNote({
        patientId: form.patientId,
        shift: form.shift,
        observation: form.observation,
        careProvided: form.careProvided,
        patientResponse: form.patientResponse,
        additionalNotes: form.additionalNotes || null,
        isFlagged: form.isFlagged,
      });
      if (onShowToast) onShowToast('Nursing clinical note saved successfully.');
      setShowModal(false);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.response?.data?.message || err.message || 'Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={24} color="#8b5cf6" />
            Nursing Clinical Notes Log
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            SOAP-aligned shift observations, nursing interventions, and patient responses
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenModal}>
          <PlusCircle size={15} style={{ marginRight: '6px' }} /> Add Clinical Note
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div>
            <InputField
              placeholder="Search in notes or patient names..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div>
            <SelectField
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              options={[
                { value: '', label: 'All Patients' },
                ...patientsList.map((p) => ({ value: p.id, label: `${p.fullName} (${p.patientIdNumber})` })),
              ]}
              style={{ margin: 0 }}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsFlaggedFilter(!isFlaggedFilter)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: isFlaggedFilter ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                border: isFlaggedFilter ? '1px solid #ef4444' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: isFlaggedFilter ? '#f87171' : 'var(--text-main, #fff)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={14} />
              <span>Flagged For Doctor Review</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Notes List */}
      {loading ? (
        <LoadingState message="Fetching clinical notes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : notesList.length === 0 ? (
        <EmptyState
          title="No nursing notes found"
          description="Click 'Add Clinical Note' to create your shift observation record."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notesList.map((note) => (
            <Card
              key={note.id}
              style={{
                background: note.isFlagged ? 'rgba(239, 68, 68, 0.04)' : undefined,
                border: note.isFlagged ? '1px solid rgba(239, 68, 68, 0.3)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    {note.patient?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                      {note.patient?.fullName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {note.patient?.patientIdNumber} &bull; {note.patient?.age}y &bull; {note.patient?.gender}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Badge variant={note.isFlagged ? 'rose' : 'teal'}>{note.shift || 'Shift Care'}</Badge>
                  {note.isFlagged && (
                    <Badge variant="rose">
                      <AlertTriangle size={11} style={{ marginRight: '3px' }} /> Flagged for MD
                    </Badge>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 3-Column SOAP Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#00d2b4', marginBottom: '6px' }}>
                    1. CLINICAL OBSERVATION
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main, #fff)', lineHeight: '1.5' }}>
                    {note.observation}
                  </p>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                    2. NURSING CARE PROVIDED
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main, #fff)', lineHeight: '1.5' }}>
                    {note.careProvided}
                  </p>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#a78bfa', marginBottom: '6px' }}>
                    3. PATIENT RESPONSE
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main, #fff)', lineHeight: '1.5' }}>
                    {note.patientResponse}
                  </p>
                </div>
              </div>

              {note.additionalNotes && (
                <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                  <strong>Additional Remarks:</strong> {note.additionalNotes}
                </div>
              )}

              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', textAlign: 'right' }}>
                Recorded by: <strong style={{ color: 'var(--text-main, #fff)' }}>{note.nurse?.user?.fullName || 'Duty Nurse'}</strong>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Nursing Note Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add Inpatient Clinical Nursing Note"
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SelectField
              label="Select Inpatient"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              options={patientsList.map((p) => ({ value: p.id, label: `${p.fullName} (${p.patientIdNumber})` }))}
              required
            />

            <InputField
              label="Shift Details"
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
              required
            />

            <TextareaField
              label="1. Clinical Observation (Objective / Subjective)"
              placeholder="Physical findings, wound appearance, state of consciousness, IV cannula site status..."
              value={form.observation}
              onChange={(e) => setForm({ ...form, observation: e.target.value })}
              required
            />

            <TextareaField
              label="2. Care Provided (Nursing Interventions)"
              placeholder="Procedures, medications administered, repositioning, dressing change..."
              value={form.careProvided}
              onChange={(e) => setForm({ ...form, careProvided: e.target.value })}
              required
            />

            <TextareaField
              label="3. Patient Response"
              placeholder="Verbal response, pain scale reduction, fluid intake tolerance..."
              value={form.patientResponse}
              onChange={(e) => setForm({ ...form, patientResponse: e.target.value })}
              required
            />

            <TextareaField
              label="Additional Notes (Optional)"
              placeholder="Family visits, dietary intake, escorting to tests..."
              value={form.additionalNotes}
              onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="flagNoteForm"
                checked={form.isFlagged}
                onChange={(e) => setForm({ ...form, isFlagged: e.target.checked })}
              />
              <label htmlFor="flagNoteForm" style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: '600', cursor: 'pointer' }}>
                Flag for Attending Doctor Attention
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Nursing Note'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NurseNursingNotesPage;
