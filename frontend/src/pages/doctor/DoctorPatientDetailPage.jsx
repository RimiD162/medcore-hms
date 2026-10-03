import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Heart,
  Stethoscope,
  ClipboardList,
  FileText,
  Pill,
  Microscope,
  FolderOpen,
  Calendar,
  Clock,
  Download,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, Badge, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const DoctorPatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadPatientData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getPatientById(patientId);
      if (res.data) {
        setPatient(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load patient record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  if (loading) {
    return <LoadingState message="Loading Patient Clinical Record..." />;
  }

  if (error || !patient) {
    return (
      <ErrorState
        title="Patient Record Unavailable"
        message={error || 'Could not locate patient profile.'}
        onRetry={loadPatientData}
      />
    );
  }

  return (
    <div className="med-patient-detail-page">
      {/* 1. Back Navigation & Action Bar */}
      <div className="med-detail-header-bar">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/app/doctor/patients')}
        >
          Back to Patients Roster
        </Button>
      </div>

      {/* 2. Patient Identity & Critical Alerts Banner */}
      <Card padding="default" className="med-patient-banner-card med-mb-4">
        <div className="med-patient-banner-inner">
          <div className="med-patient-banner-avatar">
            <User size={36} color="#00a88f" />
          </div>

          <div className="med-patient-banner-main">
            <div className="med-patient-title-row">
              <h2 className="med-patient-name">{patient.fullName}</h2>
              <span className="med-patient-mrn-badge">{patient.patientIdNumber}</span>
              <span className="med-patient-status-badge">{patient.status}</span>
            </div>

            <div className="med-patient-meta-row">
              <span><strong>Age:</strong> {patient.age} years</span>
              <span>&bull;</span>
              <span><strong>Gender:</strong> {patient.gender}</span>
              <span>&bull;</span>
              <span><strong>Blood Group:</strong> <span className="med-blood-group-tag">{patient.bloodGroup}</span></span>
              <span>&bull;</span>
              <span><Phone size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {patient.phone}</span>
              {patient.email && (
                <>
                  <span>&bull;</span>
                  <span><Mail size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {patient.email}</span>
                </>
              )}
            </div>

            {patient.emergencyContact && (
              <div className="med-patient-emergency-info">
                Emergency Contact: <strong>{patient.emergencyContact}</strong> ({patient.emergencyPhone || 'N/A'})
              </div>
            )}
          </div>

          <div className="med-patient-banner-actions">
            {patient.appointments?.[0] && ['SCHEDULED', 'CONFIRMED'].includes(patient.appointments[0].status) && (
              <Button
                variant="primary"
                icon={Stethoscope}
                onClick={() => navigate(`/app/doctor/consultations/${patient.appointments[0].id}`)}
              >
                Start Consultation
              </Button>
            )}
          </div>
        </div>

        {/* Prominent Allergies & Chronic Conditions Alert Strip */}
        <div className="med-critical-alerts-strip">
          <div className="med-alert-box med-alert-allergies">
            <div className="med-alert-header">
              <AlertTriangle size={15} color="#d93c46" />
              <span>Known Clinical Allergies:</span>
            </div>
            <div className="med-alert-pills">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((allergy, i) => (
                  <span key={i} className="med-allergy-pill">{allergy}</span>
                ))
              ) : (
                <span className="med-no-alert">No known drug/food allergies recorded.</span>
              )}
            </div>
          </div>

          <div className="med-alert-box med-alert-chronic">
            <div className="med-alert-header">
              <Heart size={15} color="#0284c7" />
              <span>Chronic Conditions & Diagnoses:</span>
            </div>
            <div className="med-alert-pills">
              {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                patient.chronicConditions.map((cond, i) => (
                  <span key={i} className="med-chronic-pill">{cond}</span>
                ))
              ) : (
                <span className="med-no-alert">No chronic conditions listed.</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Multi-Tab Navigation */}
      <Tabs
        items={[
          { key: 'overview', label: 'Overview', icon: User },
          { key: 'history', label: `Medical History (${patient.medicalRecords?.length || 0})`, icon: FileText },
          { key: 'consultations', label: `Consultations (${patient.consultations?.length || 0})`, icon: ClipboardList },
          { key: 'prescriptions', label: `Prescriptions (${patient.prescriptions?.length || 0})`, icon: Pill },
          { key: 'laboratory', label: `Laboratory Reports (${patient.labReports?.length || 0})`, icon: Microscope },
          { key: 'documents', label: `Documents (${patient.documents?.length || 0})`, icon: FolderOpen },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="segmented"
        className="med-mb-4"
      />

      {/* 4. Tab Content Panels */}
      <div className="med-tab-panel">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="med-patient-overview-grid">
            <Card title="Patient Demographic & Contact Profile" icon={User}>
              <div className="med-info-grid">
                <div className="med-info-item">
                  <span className="med-info-label">Full Legal Name</span>
                  <span className="med-info-value">{patient.fullName}</span>
                </div>
                <div className="med-info-item">
                  <span className="med-info-label">Date of Birth</span>
                  <span className="med-info-value">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="med-info-item">
                  <span className="med-info-label">Gender & Blood Group</span>
                  <span className="med-info-value">{patient.gender} &bull; {patient.bloodGroup}</span>
                </div>
                <div className="med-info-item">
                  <span className="med-info-label">Phone & Email</span>
                  <span className="med-info-value">{patient.phone} {patient.email ? `(${patient.email})` : ''}</span>
                </div>
                <div className="med-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="med-info-label">Residential Address</span>
                  <span className="med-info-value">{patient.address || 'Not on file'}</span>
                </div>
              </div>
            </Card>

            <Card title="Recent Appointments with this Doctor" icon={Calendar}>
              {patient.appointments?.length === 0 ? (
                <p className="med-empty-block">No appointments on record.</p>
              ) : (
                <div className="med-timeline-mini">
                  {patient.appointments?.map((apt) => (
                    <div key={apt.id} className="med-mini-apt-item">
                      <div className="med-mini-apt-date">
                        {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                      </div>
                      <div className="med-mini-apt-reason">
                        {apt.type} &bull; {apt.reason || 'General'}
                      </div>
                      <Badge status={apt.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* MEDICAL HISTORY TAB */}
        {activeTab === 'history' && (
          <Card title="Chronological Medical Records Timeline" icon={FileText}>
            {patient.medicalRecords?.length === 0 ? (
              <p className="med-empty-block">No clinical medical records recorded yet.</p>
            ) : (
              <div className="med-records-timeline">
                {patient.medicalRecords?.map((rec) => (
                  <div key={rec.id} className="med-record-timeline-item">
                    <div className="med-record-timeline-marker" />
                    <div className="med-record-card">
                      <div className="med-record-top">
                        <span className="med-record-number">{rec.recordNumber}</span>
                        <span className="med-record-date">
                          {new Date(rec.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="med-record-title">{rec.title}</h4>
                      <p className="med-record-diagnosis">
                        <strong>Diagnosis:</strong> {rec.diagnosis || 'Clinical evaluation'}
                      </p>
                      {rec.summary && <p className="med-record-summary">{rec.summary}</p>}
                      {rec.notes && <p className="med-record-notes"><strong>Notes:</strong> {rec.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* CONSULTATIONS TAB */}
        {activeTab === 'consultations' && (
          <Card title="Clinical Consultations History" icon={ClipboardList}>
            {patient.consultations?.length === 0 ? (
              <p className="med-empty-block">No consultations recorded for this patient.</p>
            ) : (
              <div className="med-consultations-history-list">
                {patient.consultations?.map((cons) => (
                  <div key={cons.id} className="med-consultation-history-card">
                    <div className="med-cons-hist-header">
                      <div>
                        <span className="med-cons-hist-date">
                          {new Date(cons.createdAt).toLocaleDateString()}
                        </span>
                        <Badge status={cons.status} size="sm" />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/app/doctor/consultations/${cons.appointmentId}`)}
                      >
                        Open Consultation
                      </Button>
                    </div>
                    <div className="med-cons-hist-body">
                      <p><strong>Chief Complaint:</strong> {cons.chiefComplaint || 'N/A'}</p>
                      <p><strong>Diagnosis:</strong> {cons.diagnosis || 'Pending'}</p>
                      {cons.treatmentPlan && <p><strong>Treatment:</strong> {cons.treatmentPlan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <Card title="Electronic Prescriptions" icon={Pill}>
            {patient.prescriptions?.length === 0 ? (
              <p className="med-empty-block">No prescriptions recorded for this patient.</p>
            ) : (
              <div className="med-rx-history-grid">
                {patient.prescriptions?.map((rx) => (
                  <div key={rx.id} className="med-rx-card">
                    <div className="med-rx-card-top">
                      <span className="med-rx-num">{rx.prescriptionNumber}</span>
                      <span className="med-rx-date">{new Date(rx.prescribedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="med-rx-items-list">
                      {rx.items?.map((item, idx) => (
                        <div key={idx} className="med-rx-item-row">
                          <span className="med-rx-med-name">{item.medicineName} ({item.dosage})</span>
                          <span className="med-rx-med-freq">{item.frequency} &bull; {item.duration}</span>
                        </div>
                      ))}
                    </div>
                    {rx.notes && <p className="med-rx-notes">{rx.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* LABORATORY TAB */}
        {activeTab === 'laboratory' && (
          <Card title="Laboratory & Diagnostic Investigations" icon={Microscope}>
            {patient.labReports?.length === 0 ? (
              <p className="med-empty-block">No laboratory reports on record.</p>
            ) : (
              <div className="med-lab-history-list">
                {patient.labReports?.map((lab) => (
                  <div key={lab.id} className="med-lab-card">
                    <div className="med-lab-card-header">
                      <div>
                        <span className="med-lab-report-num">{lab.reportNumber}</span>
                        <h4 className="med-lab-test-name">{lab.testName}</h4>
                        <span className="med-lab-cat">{lab.category}</span>
                      </div>
                      <Badge status={lab.status} />
                    </div>
                    {lab.resultSummary && (
                      <div className="med-lab-result-box">
                        <strong>Result Summary:</strong> {lab.resultSummary}
                      </div>
                    )}
                    {lab.referenceRange && (
                      <div className="med-lab-ref-range">
                        Reference: {lab.referenceRange}
                      </div>
                    )}
                    {lab.doctorNotes && (
                      <div className="med-lab-doc-notes">
                        <strong>Doctor Review:</strong> {lab.doctorNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <Card title="Categorized Clinical Documents" icon={FolderOpen}>
            {patient.documents?.length === 0 ? (
              <p className="med-empty-block">No documents uploaded for this patient.</p>
            ) : (
              <div className="med-doc-grid">
                {patient.documents?.map((doc) => (
                  <div key={doc.id} className="med-doc-card">
                    <div className="med-doc-icon-box">
                      <FileText size={24} color="#00a88f" />
                    </div>
                    <div className="med-doc-details">
                      <span className="med-doc-title">{doc.title}</span>
                      <span className="med-doc-meta">{doc.category} &bull; {doc.fileSize || 'PDF'}</span>
                    </div>
                    <Button size="sm" variant="outline" icon={Download} onClick={() => onShowToast && onShowToast(`Downloading ${doc.title}`)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientDetailPage;
