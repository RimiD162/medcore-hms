import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Activity,
  Pill,
  BedDouble,
  ChevronRight,
  AlertTriangle,
  HeartPulse,
  PlusCircle,
  FileText,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, InputField, SelectField, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseAssignedPatientsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');

  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getAssignedPatients({ search, ward: wardFilter }),
    [search, wardFilter]
  );

  const patients = data?.patients || [];
  const total = data?.pagination?.total || patients.length;

  return (
    <div className="med-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#00d2b4" />
            Assigned Inpatient Directory
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Active patients assigned to your care shift ({total} total assigned)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/app/nurse/vitals')}>
            <Activity size={15} style={{ marginRight: '6px' }} /> Vital Monitor
          </Button>
          <Button variant="primary" onClick={() => navigate('/app/nurse/medication-administration')}>
            <Pill size={15} style={{ marginRight: '6px' }} /> e-MAR Rounds
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <InputField
              placeholder="Search by Patient Name, ID, or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div>
            <SelectField
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              options={[
                { value: '', label: 'All Wards & Units' },
                { value: 'Ward 3B', label: 'Ward 3B - General Medical' },
                { value: 'ICU', label: 'ICU - Intensive Care Unit' },
                { value: 'Maternity', label: 'Maternity & Neonatal Ward' },
              ]}
              style={{ margin: 0 }}
            />
          </div>
        </div>
      </Card>

      {/* Patient Directory Grid */}
      {loading ? (
        <LoadingState message="Loading assigned patient roster..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No assigned patients found"
          description="Try adjusting your search criteria or ward filter."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {patients.map((p) => {
            const admission = p.admission;
            const vital = p.latestVital;

            return (
              <Card
                key={p.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                }}
                onClick={() => navigate(`/app/nurse/patients/${p.id}`)}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 210, 180, 0.2), rgba(0, 168, 143, 0.4))', color: '#00d2b4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', border: '1px solid rgba(0, 210, 180, 0.3)' }}>
                        {p.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                          {p.fullName}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {p.patientIdNumber} &bull; {p.age}y &bull; {p.gender} &bull; <strong style={{ color: '#00d2b4' }}>{p.bloodGroup}</strong>
                        </span>
                      </div>
                    </div>

                    {admission && (
                      <Badge variant="blue">
                        <BedDouble size={12} style={{ marginRight: '4px' }} />
                        {admission.bedNumber}
                      </Badge>
                    )}
                  </div>

                  {/* Ward & Diagnosis Info */}
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))', marginBottom: '12px', fontSize: '0.83rem' }}>
                    <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '3px' }}>
                      Ward / Location: <strong style={{ color: 'var(--text-main, #fff)' }}>{admission?.ward || 'General'}</strong> &bull; Room {admission?.roomNumber || 'N/A'}
                    </div>
                    <div style={{ color: 'var(--text-muted, #94a3b8)' }}>
                      Admitting Diagnosis: <strong style={{ color: '#e2e8f0' }}>{admission?.admittingDiagnosis || 'Under Medical Observation'}</strong>
                    </div>
                  </div>

                  {/* Latest Vital Signs Snapshot */}
                  {vital ? (
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: vital.isFlagged ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 210, 180, 0.05)', border: vital.isFlagged ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0, 210, 180, 0.15)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: vital.isFlagged ? '#ef4444' : '#00d2b4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Activity size={13} /> Latest Vital Check
                        </span>
                        {vital.isFlagged && (
                          <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={11} /> Flagged
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main, #fff)' }}>
                        BP <strong>{vital.bloodPressure}</strong> &bull; HR <strong>{vital.pulse} bpm</strong> &bull; SpO2 <strong>{vital.oxygenSaturation}%</strong> &bull; {vital.temperature}°F
                      </div>
                      {vital.flagReason && (
                        <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '3px' }}>
                          {vital.flagReason}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
                      No vital checks recorded today
                    </div>
                  )}

                  {/* Pending Meds & Allergies Alert */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '16px' }}>
                    <span>
                      Pending Meds: <strong style={{ color: p.pendingMedsCount > 0 ? '#f59e0b' : '#34d399' }}>{p.pendingMedsCount} doses</strong>
                    </span>
                    {p.allergies && p.allergies.length > 0 && (
                      <span style={{ color: '#ef4444', fontWeight: '600' }}>
                        Allergies: {p.allergies.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: '#00d2b4', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open Clinical EMR <ChevronRight size={14} />
                  </span>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/app/nurse/vitals?patientId=${p.id}`); }}>
                    <Activity size={13} style={{ marginRight: '4px' }} /> Quick Vitals
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NurseAssignedPatientsPage;
