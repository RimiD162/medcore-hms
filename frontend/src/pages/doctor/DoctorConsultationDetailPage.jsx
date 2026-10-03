import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  Plus,
  Trash2,
  Microscope,
  Pill,
  Calendar,
  Clock,
  User,
  FileText,
  Sparkles,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  FormField,
  Modal,
  ConfirmationDialog,
  LoadingState,
  ErrorState,
} from '../../components/ui';

const commonSymptomsList = [
  'Chest Tightness',
  'Shortness of Breath',
  'High Fever',
  'Productive Cough',
  'Throat Pain',
  'Headache',
  'Dizziness',
  'Palpitations',
  'Abdominal Pain',
  'Fatigue',
];

export const DoctorConsultationDetailPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultationData, setConsultationData] = useState(null);
  const [patient, setPatient] = useState(null);
  const [appointment, setAppointment] = useState(null);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [vitals, setVitals] = useState({
    bp: '120/80',
    heartRate: 72,
    temp: 98.6,
    spo2: 98,
    weight: 70,
    height: 172,
    bmi: 23.7,
  });
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Prescription Items State
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 Days', route: 'Oral', instructions: 'After meals' },
  ]);
  const [includePrescription, setIncludePrescription] = useState(false);

  // Follow-up State
  const [includeFollowUp, setIncludeFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Modals & Action loading
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labTestName, setLabTestName] = useState('');
  const [labCategory, setLabCategory] = useState('Clinical Pathology');
  const [labNotes, setLabNotes] = useState('');

  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate BMI automatically on weight/height changes
  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = vitals.height / 100;
      const calculatedBmi = (vitals.weight / (heightInMeters * heightInMeters)).toFixed(1);
      setVitals((prev) => ({ ...prev, bmi: parseFloat(calculatedBmi) }));
    }
  }, [vitals.weight, vitals.height]);

  const loadConsultation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getConsultationForAppointment(appointmentId);
      if (res.data) {
        const c = res.data.consultation;
        setConsultationData(c);
        setPatient(res.data.patient);
        setAppointment(res.data.appointment);

        // Populate fields
        setChiefComplaint(c.chiefComplaint || res.data.appointment.reason || '');
        setSymptoms(c.symptoms || []);
        if (c.vitals) {
          setVitals(c.vitals);
        }
        setClinicalNotes(c.clinicalNotes || '');
        setDiagnosis(c.diagnosis || '');
        setTreatmentPlan(c.treatmentPlan || '');
        setDoctorNotes(c.doctorNotes || '');
        setIsCompleted(c.status === 'COMPLETED');

        if (c.prescription?.items && c.prescription.items.length > 0) {
          setPrescriptionItems(c.prescription.items);
          setIncludePrescription(true);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize consultation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultation();
  }, [appointmentId]);

  // Symptoms helper
  const toggleSymptom = (s) => {
    if (symptoms.includes(s)) {
      setSymptoms(symptoms.filter((item) => item !== s));
    } else {
      setSymptoms([...symptoms, s]);
    }
  };

  const addCustomSymptom = () => {
    if (customSymptomInput.trim() && !symptoms.includes(customSymptomInput.trim())) {
      setSymptoms([...symptoms, customSymptomInput.trim()]);
      setCustomSymptomInput('');
    }
  };

  // Prescription items helpers
  const handleItemChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 Days', route: 'Oral', instructions: 'After meals' },
    ]);
  };

  const removePrescriptionItem = (index) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (isCompleted) {
      if (onShowToast) onShowToast('Consultation is already completed and locked');
      return;
    }

    setSaveLoading(true);
    try {
      await doctorApi.saveConsultationDraft(consultationData.id, {
        chiefComplaint,
        symptoms,
        vitals,
        clinicalNotes,
        diagnosis,
        treatmentPlan,
        doctorNotes,
      });
      if (onShowToast) onShowToast('Consultation draft saved successfully');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to save draft');
    } finally {
      setSaveLoading(false);
    }
  };

  // Order Lab Test Modal Handler
  const handleOrderLabTest = async () => {
    if (!labTestName.trim()) {
      if (onShowToast) onShowToast('Please enter investigation / test name');
      return;
    }

    try {
      await doctorApi.orderLabTest({
        patientId: patient.id,
        testName: labTestName,
        category: labCategory,
        doctorNotes: labNotes,
      });
      if (onShowToast) onShowToast(`Laboratory order for "${labTestName}" submitted to Pathology`);
      setLabModalOpen(false);
      setLabTestName('');
      setLabNotes('');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to order lab test');
    }
  };

  // Complete Consultation Handler (Single Atomic Transaction)
  const handleCompleteConsultation = async () => {
    if (!chiefComplaint || !diagnosis || !clinicalNotes || !treatmentPlan) {
      if (onShowToast) {
        onShowToast('Please complete Chief Complaint, Diagnosis, Clinical Notes, and Treatment Plan before finalizing.');
      }
      setCompleteConfirmOpen(false);
      return;
    }

    setCompleteLoading(true);
    try {
      // 1. Complete consultation transaction
      await doctorApi.completeConsultation(consultationData.id, {
        chiefComplaint,
        symptoms: symptoms.length > 0 ? symptoms : ['General Consultation'],
        vitals,
        clinicalNotes,
        diagnosis,
        treatmentPlan,
        doctorNotes,
        followUp: includeFollowUp && followUpDate ? {
          followUpDate,
          reason: followUpReason || `Follow-up for ${diagnosis}`,
          notes: followUpNotes,
        } : null,
      });

      // 2. If prescription items are filled, save prescription
      const validItems = prescriptionItems.filter((it) => it.medicineName.trim().length > 0);
      if (includePrescription && validItems.length > 0) {
        await doctorApi.createPrescription({
          patientId: patient.id,
          consultationId: consultationData.id,
          notes: treatmentPlan,
          items: validItems,
        });
      }

      setIsCompleted(true);
      setCompleteConfirmOpen(false);
      if (onShowToast) {
        onShowToast(`Consultation for ${patient.fullName} completed. Medical Record REC-2026 generated.`);
      }
      navigate('/app/doctor/appointments?view=today');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to complete consultation transaction');
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Clinical Consultation Workspace..." />;
  }

  if (error || !consultationData) {
    return (
      <ErrorState
        title="Consultation Unavailable"
        message={error || 'Could not load appointment consultation session.'}
        onRetry={loadConsultation}
      />
    );
  }

  return (
    <div className="med-consultation-workspace">
      {/* 1. Header Toolbar */}
      <div className="med-cons-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/app/doctor/appointments?view=today')}
          >
            Back
          </Button>
          <div>
            <h2 className="med-cons-title">
              Clinical Consultation &bull; {patient.fullName}
            </h2>
            <span className="med-cons-sub">
              MRN: {patient.patientIdNumber} &bull; Appointment #{appointment?.appointmentNumber}
            </span>
          </div>
        </div>

        <div className="med-cons-actions">
          <Button
            variant="outline"
            icon={Microscope}
            onClick={() => setLabModalOpen(true)}
            disabled={isCompleted}
          >
            Order Lab Test
          </Button>

          <Button
            variant="outline"
            icon={Save}
            onClick={handleSaveDraft}
            loading={saveLoading}
            disabled={isCompleted}
          >
            Save Draft
          </Button>

          {!isCompleted ? (
            <Button
              variant="teal"
              icon={CheckCircle2}
              onClick={() => setCompleteConfirmOpen(true)}
            >
              Complete Consultation
            </Button>
          ) : (
            <span className="med-completed-banner">
              <CheckCircle2 size={16} /> Consultation Finalized & Signed
            </span>
          )}
        </div>
      </div>

      {/* 2. Workspace Two-Column Layout */}
      <div className="med-cons-workspace-grid">
        {/* LEFT COLUMN: Patient EMR Summary Panel */}
        <div className="med-cons-left-col">
          {/* Patient Profile Snapshot */}
          <Card title="Patient Profile & History" icon={User} padding="compact">
            <div className="med-patient-snapshot">
              <div className="med-snap-row">
                <span className="med-snap-name">{patient.fullName}</span>
                <span className="med-snap-age">{patient.gender}, {patient.age} yrs</span>
              </div>
              <div className="med-snap-meta">
                Blood Group: <strong>{patient.bloodGroup}</strong> &bull; {patient.phone}
              </div>
            </div>

            {/* Critical Allergy Warning */}
            <div className="med-cons-allergy-alert">
              <div className="med-alert-head">
                <AlertTriangle size={14} color="#d93c46" />
                <span>Allergies:</span>
              </div>
              <div className="med-alert-body">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((a, i) => (
                    <span key={i} className="med-allergy-chip">{a}</span>
                  ))
                ) : (
                  <span className="med-dim-text">No recorded allergies</span>
                )}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="med-cons-chronic-alert">
              <div className="med-alert-head">
                <Heart size={14} color="#0284c7" />
                <span>Chronic Conditions:</span>
              </div>
              <div className="med-alert-body">
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  patient.chronicConditions.map((c, i) => (
                    <span key={i} className="med-chronic-chip">{c}</span>
                  ))
                ) : (
                  <span className="med-dim-text">No chronic conditions</span>
                )}
              </div>
            </div>
          </Card>

          {/* Previous Prescriptions History */}
          <Card title="Previous Prescriptions" icon={Pill} padding="compact" className="med-mt-4">
            {patient.prescriptions?.length === 0 ? (
              <p className="med-empty-block">No previous prescriptions.</p>
            ) : (
              <div className="med-mini-history-list">
                {patient.prescriptions?.map((rx) => (
                  <div key={rx.id} className="med-mini-history-item">
                    <span className="med-mini-hist-title">{rx.prescriptionNumber}</span>
                    <span className="med-mini-hist-date">{new Date(rx.prescribedDate).toLocaleDateString()}</span>
                    <div className="med-mini-hist-items">
                      {rx.items?.map((it, idx) => (
                        <span key={idx} className="med-mini-pill-tag">
                          {it.medicineName} ({it.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Previous Lab Reports */}
          <Card title="Laboratory Investigations" icon={Microscope} padding="compact" className="med-mt-4">
            {patient.labReports?.length === 0 ? (
              <p className="med-empty-block">No previous lab investigations.</p>
            ) : (
              <div className="med-mini-history-list">
                {patient.labReports?.map((lab) => (
                  <div key={lab.id} className="med-mini-history-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="med-mini-hist-title">{lab.testName}</span>
                      <Badge status={lab.status} size="sm" />
                    </div>
                    {lab.resultSummary && (
                      <p className="med-mini-hist-desc">{lab.resultSummary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Clinical Examination Form */}
        <div className="med-cons-right-col">
          <Card title="Clinical Evaluation & Medical Assessment" icon={Stethoscope}>
            {/* 1. Chief Complaint */}
            <FormField label="Chief Complaint / Presenting Problem" required>
              <Input
                type="text"
                placeholder="e.g. Chest heaviness on morning exertion and recurrent dizziness"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                disabled={isCompleted}
                required
              />
            </FormField>

            {/* 2. Symptoms Interactive Tag Picker */}
            <div className="med-form-section">
              <label className="med-form-label">Associated Symptoms</label>
              <div className="med-symptoms-chips-wrap">
                {commonSymptomsList.map((sym) => {
                  const isSelected = symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      className={`med-symptom-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => !isCompleted && toggleSymptom(sym)}
                      disabled={isCompleted}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sym}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Symptom */}
              {!isCompleted && (
                <div className="med-custom-symptom-row">
                  <Input
                    type="text"
                    placeholder="Add custom symptom..."
                    value={customSymptomInput}
                    onChange={(e) => setCustomSymptomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
                  />
                  <Button size="sm" variant="outline" onClick={addCustomSymptom}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* 3. Patient Vitals Matrix */}
            <div className="med-form-section">
              <label className="med-form-label">Physical Examination & Vitals</label>
              <div className="med-vitals-grid">
                <div className="med-vital-box">
                  <span className="med-vital-label">Blood Pressure</span>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={vitals.bp || ''}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">mmHg</span>
                </div>

                <div className="med-vital-box">
                  <span className="med-vital-label">Heart Rate</span>
                  <input
                    type="number"
                    placeholder="72"
                    value={vitals.heartRate || ''}
                    onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value, 10) || null })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">bpm</span>
                </div>

                <div className="med-vital-box">
                  <span className="med-vital-label">Temperature</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitals.temp || ''}
                    onChange={(e) => setVitals({ ...vitals, temp: parseFloat(e.target.value) || null })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">°F</span>
                </div>

                <div className="med-vital-box">
                  <span className="med-vital-label">Oxygen (SpO2)</span>
                  <input
                    type="number"
                    placeholder="99"
                    value={vitals.spo2 || ''}
                    onChange={(e) => setVitals({ ...vitals, spo2: parseInt(e.target.value, 10) || null })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">%</span>
                </div>

                <div className="med-vital-box">
                  <span className="med-vital-label">Weight</span>
                  <input
                    type="number"
                    placeholder="70"
                    value={vitals.weight || ''}
                    onChange={(e) => setVitals({ ...vitals, weight: parseFloat(e.target.value) || null })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">kg</span>
                </div>

                <div className="med-vital-box">
                  <span className="med-vital-label">Height</span>
                  <input
                    type="number"
                    placeholder="172"
                    value={vitals.height || ''}
                    onChange={(e) => setVitals({ ...vitals, height: parseFloat(e.target.value) || null })}
                    disabled={isCompleted}
                    className="med-vital-input"
                  />
                  <span className="med-vital-unit">cm</span>
                </div>

                <div className="med-vital-box med-vital-bmi">
                  <span className="med-vital-label">Calculated BMI</span>
                  <span className="med-vital-value-display">{vitals.bmi || '--'}</span>
                  <span className="med-vital-unit">kg/m²</span>
                </div>
              </div>
            </div>

            {/* 4. Clinical Notes */}
            <FormField label="Clinical Examination & Observations" required>
              <Textarea
                rows={3}
                placeholder="Document physical findings, auscultation, palpation, and clinical notes..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                disabled={isCompleted}
                required
              />
            </FormField>

            {/* 5. Diagnosis / Clinical Assessment */}
            <FormField label="Diagnosis / Clinical Impression" required>
              <Input
                type="text"
                placeholder="e.g. Essential Hypertension (Grade 2) with Suboptimal Control"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={isCompleted}
                required
              />
            </FormField>

            {/* 6. Treatment Plan */}
            <FormField label="Treatment Plan & Dietary / Lifestyle Advice" required>
              <Textarea
                rows={3}
                placeholder="Outline management plan, lifestyle modifications, and patient counselling..."
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                disabled={isCompleted}
                required
              />
            </FormField>

            {/* 7. Electronic Prescription Builder */}
            <div className="med-form-section">
              <div className="med-section-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={16} color="#00a88f" />
                  <span className="med-form-label" style={{ marginBottom: 0 }}>
                    E-Prescription (Rx)
                  </span>
                </div>
                {!isCompleted && (
                  <Button size="sm" variant="outline" icon={Plus} onClick={addPrescriptionItem}>
                    Add Medication
                  </Button>
                )}
              </div>

              <div className="med-prescription-builder-table">
                {prescriptionItems.map((item, index) => (
                  <div key={index} className="med-rx-builder-row">
                    <div className="med-rx-field-med">
                      <Input
                        type="text"
                        placeholder="Medicine Name (e.g. Telmisartan 80mg)"
                        value={item.medicineName}
                        onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="med-rx-field-sm">
                      <Input
                        type="text"
                        placeholder="Dosage (80mg)"
                        value={item.dosage}
                        onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="med-rx-field-sm">
                      <Input
                        type="text"
                        placeholder="Frequency (1-0-1)"
                        value={item.frequency}
                        onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="med-rx-field-sm">
                      <Input
                        type="text"
                        placeholder="Duration (30 Days)"
                        value={item.duration}
                        onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                    <div className="med-rx-field-instr">
                      <Input
                        type="text"
                        placeholder="Instructions (After breakfast)"
                        value={item.instructions}
                        onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                        disabled={isCompleted}
                      />
                    </div>
                    {!isCompleted && prescriptionItems.length > 1 && (
                      <button
                        type="button"
                        className="med-rx-remove-btn"
                        onClick={() => removePrescriptionItem(index)}
                        title="Remove row"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Follow-up Scheduler */}
            <div className="med-form-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="enableFollowUp"
                  checked={includeFollowUp}
                  onChange={(e) => setIncludeFollowUp(e.target.checked)}
                  disabled={isCompleted}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="enableFollowUp" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Schedule Clinical Follow-up Consultation
                </label>
              </div>

              {includeFollowUp && (
                <div className="med-followup-form-grid">
                  <FormField label="Follow-up Date" required>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      disabled={isCompleted}
                      required
                    />
                  </FormField>
                  <FormField label="Follow-up Reason" required>
                    <Input
                      type="text"
                      placeholder="e.g. Blood pressure titration review"
                      value={followUpReason}
                      onChange={(e) => setFollowUpReason(e.target.value)}
                      disabled={isCompleted}
                    />
                  </FormField>
                </div>
              )}
            </div>

            {/* 9. Doctor Private Notes */}
            <FormField label="Confidential Physician Notes (Internal Only)">
              <Textarea
                rows={2}
                placeholder="Internal clinical thoughts, differential diagnoses, or referral notes..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                disabled={isCompleted}
              />
            </FormField>
          </Card>
        </div>
      </div>

      {/* 3. Order Lab Test Modal */}
      <Modal
        isOpen={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        title="Order Laboratory Investigation"
        subtitle={`Ordering diagnostic test for ${patient.fullName}`}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setLabModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOrderLabTest}>
              Submit Lab Order
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <FormField label="Test / Panel Name" required>
            <Input
              type="text"
              placeholder="e.g. Complete Lipid Profile & Serum Creatinine"
              value={labTestName}
              onChange={(e) => setLabTestName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Diagnostic Category" required>
            <Select
              value={labCategory}
              onChange={(e) => setLabCategory(e.target.value)}
            >
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="Clinical Biochemistry">Clinical Biochemistry</option>
              <option value="Hematology">Hematology</option>
              <option value="Endocrinology & Immunology">Endocrinology & Immunology</option>
              <option value="Pulmonary Function Lab">Pulmonary Function Lab</option>
              <option value="Radiology & Imaging">Radiology & Imaging</option>
            </Select>
          </FormField>

          <FormField label="Clinical Indication / Instructions">
            <Textarea
              rows={2}
              placeholder="e.g. Fasting sample required, assess renal function before statin escalation"
              value={labNotes}
              onChange={(e) => setLabNotes(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* 4. Complete Consultation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={completeConfirmOpen}
        onClose={() => setCompleteConfirmOpen(false)}
        onConfirm={handleCompleteConsultation}
        title="Finalize & Sign Consultation?"
        message={`Are you sure you want to complete this consultation for ${patient.fullName}? This will lock the consultation, mark appointment #${appointment?.appointmentNumber} as Completed, generate an official Medical Record, and queue prescriptions.`}
        confirmText="Finalize & Sign"
        variant="teal"
        loading={completeLoading}
      />
    </div>
  );
};

export default DoctorConsultationDetailPage;
