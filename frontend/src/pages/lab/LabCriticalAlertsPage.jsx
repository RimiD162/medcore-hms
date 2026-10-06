import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Activity,
  Microscope,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, LoadingState, ErrorState } from '../../components/ui';

export const LabCriticalAlertsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getReports({
        overallFlag: 'CRITICAL',
        search: search || undefined,
      }),
    [search]
  );

  const criticalReports = data?.reports || [];

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header with Panic Value Pulsing Alert */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
              Critical Biomarker Alert Queue
            </h1>
            <Badge variant="danger">{criticalReports.length} Panic Value Cases</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Biomarker assay values requiring immediate clinical notification to attending doctors according to hospital safety protocol.
          </p>
        </div>

        <Button
          variant="outline"
          icon={Activity}
          onClick={() => navigate('/app/lab/worklist')}
        >
          Result Worklist &rarr;
        </Button>
      </div>

      {/* Search Input */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ maxWidth: '400px' }}>
          <Input
            placeholder="Search critical report by patient or report #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
      </Card>

      {/* Critical Queue List */}
      {loading ? (
        <LoadingState message="Scanning for critical panic value laboratory findings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : criticalReports.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Critical Value Alerts Active
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            All tested patient biomarkers are within safe clinical ranges or have been acknowledged by attending physicians.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {criticalReports.map((report) => (
            <Card
              key={report.id}
              style={{
                padding: '20px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Left: Panic Flags and Findings */}
                <div style={{ minWidth: '300px', flex: '1 1 350px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>
                      {report.reportNumber}
                    </span>
                    <Badge variant="danger">CRITICAL BIOMARKER</Badge>
                    <Badge variant={report.status === 'RELEASED' ? 'success' : 'warning'}>
                      {report.status}
                    </Badge>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Patient: {report.order?.patient?.fullName || 'Patient'}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>
                      (MRN: {report.order?.patient?.patientId || 'N/A'}, Age: {report.order?.patient?.age || 'N/A'}y)
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Order: <strong style={{ color: '#8b5cf6' }}>{report.order?.orderNumber}</strong> &bull; Priority: {report.order?.priority || 'STAT'}
                  </div>

                  {/* Highlight Critical Parameters */}
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {report.order?.items?.map((item) => {
                      const criticalVals = (item.result?.values || []).filter((v) => v.flag === 'CRITICAL');
                      if (criticalVals.length === 0) return null;
                      return criticalVals.map((cv) => (
                        <span
                          key={cv.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <AlertTriangle size={13} />
                          {cv.parameterName || cv.parameterCode}: {cv.numericValue !== null ? cv.numericValue : cv.textValue} {cv.unit} (Ref: {cv.referenceRange})
                        </span>
                      ));
                    })}
                  </div>
                </div>

                {/* Right: Clinician Notification Details & Jump Button */}
                <div style={{ minWidth: '260px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    ATTENDING CLINICIAN CONTACT:
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Dr. {report.order?.orderingDoctor?.user?.fullName || report.order?.orderingDoctor?.fullName || 'Physician'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Dept: {report.order?.orderingDoctor?.department || 'OPD / Emergency'}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Microscope}
                      onClick={() => navigate(`/app/lab/reports/${report.id}`)}
                      style={{ width: '100%' }}
                    >
                      Open & Verify Critical Report &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabCriticalAlertsPage;
