import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  FlaskConical,
  TestTube,
  ShieldAlert,
  History,
  Info,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabResultEntryPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // Load order data to find the specific item
  const { data: ordersData, loading, error, refetch } = useLabData(
    () => labApi.getOrders({ limit: 100 }),
    [itemId]
  );

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form State
  const [paramValues, setParamValues] = useState({});
  const [resultNotes, setResultNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Find target item, test definition, and existing result
  const { targetItem, testDef, existingResult, patient, order } = useMemo(() => {
    if (!ordersData?.orders) return {};
    for (const ord of ordersData.orders) {
      const itm = ord.items?.find((i) => i.id === itemId);
      if (itm) {
        return {
          targetItem: itm,
          testDef: itm.test,
          existingResult: itm.result,
          patient: ord.patient,
          order: ord,
        };
      }
    }
    return {};
  }, [ordersData, itemId]);

  // Initialize form state when item or existing result loads
  useEffect(() => {
    if (testDef && testDef.parameters) {
      const initialValues = {};
      testDef.parameters.forEach((param) => {
        // Find existing value if already entered
        const existingVal = existingResult?.values?.find(
          (v) => v.parameterId === param.id || v.parameterCode === param.code
        );
        initialValues[param.id || param.code] = existingVal
          ? existingVal.numericValue !== null && existingVal.numericValue !== undefined
            ? existingVal.numericValue
            : existingVal.textValue || ''
          : '';
      });
      setParamValues(initialValues);
      if (existingResult?.notes) {
        setResultNotes(existingResult.notes);
      }
    }
  }, [testDef, existingResult]);

  // Real-time technical flag evaluation engine (Pure Technical Range Evaluation)
  const computeFlag = (param, rawVal) => {
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      return { flag: 'NOT_EVALUATED', label: 'Pending', color: 'default' };
    }

    if (param.dataType === 'NUMERIC') {
      const num = Number(rawVal);
      if (isNaN(num)) return { flag: 'NOT_EVALUATED', label: 'Invalid', color: 'danger' };

      const cLow = param.criticalLow !== null && param.criticalLow !== undefined ? Number(param.criticalLow) : null;
      const cHigh = param.criticalHigh !== null && param.criticalHigh !== undefined ? Number(param.criticalHigh) : null;
      const rMin = param.referenceMin !== null && param.referenceMin !== undefined ? Number(param.referenceMin) : null;
      const rMax = param.referenceMax !== null && param.referenceMax !== undefined ? Number(param.referenceMax) : null;

      if (cLow !== null && num < cLow) {
        return { flag: 'CRITICAL', label: 'CRITICAL LOW', color: 'danger', isCritical: true };
      }
      if (cHigh !== null && num > cHigh) {
        return { flag: 'CRITICAL', label: 'CRITICAL HIGH', color: 'danger', isCritical: true };
      }
      if (rMin !== null && num < rMin) {
        return { flag: 'LOW', label: 'LOW', color: 'warning' };
      }
      if (rMax !== null && num > rMax) {
        return { flag: 'HIGH', label: 'HIGH', color: 'warning' };
      }
      return { flag: 'NORMAL', label: 'NORMAL', color: 'success' };
    }

    // Qualitative / Text evaluation
    if (param.normalText) {
      const normOptions = param.normalText.split(',').map((s) => s.trim().toUpperCase());
      const valUpper = String(rawVal).trim().toUpperCase();
      if (normOptions.includes(valUpper)) {
        return { flag: 'NORMAL', label: 'NORMAL', color: 'success' };
      }
      return { flag: 'CRITICAL', label: 'REACTIVE / ABNORMAL', color: 'danger', isCritical: true };
    }

    return { flag: 'NOT_EVALUATED', label: 'RECORDED', color: 'default' };
  };

  const handleValueChange = (paramId, val) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      const valuesArray = (testDef.parameters || []).map((param) => {
        const val = paramValues[param.id || param.code];
        const isNumeric = param.dataType === 'NUMERIC';
        return {
          parameterId: param.id,
          parameterCode: param.code,
          parameterName: param.name,
          unit: param.unit,
          numericValue: isNumeric && val !== '' ? Number(val) : null,
          textValue: !isNumeric || val === '' ? (val !== '' ? String(val) : null) : null,
        };
      });

      if (existingResult) {
        // Result Correction Flow
        if (!correctionReason.trim()) {
          throw new Error('Please enter a formal reason for correcting previously logged results.');
        }

        await labApi.correctResult(existingResult.id, {
          reason: correctionReason.trim(),
          values: valuesArray,
          notes: resultNotes || undefined,
        });

        setFeedbackMsg({ type: 'success', text: 'Result corrected and audit history logged successfully.' });
      } else {
        // First Time Result Entry Flow
        await labApi.enterResults(itemId, {
          values: valuesArray,
          notes: resultNotes || undefined,
        });

        setFeedbackMsg({ type: 'success', text: 'Analyzer findings recorded and technical flags computed.' });
      }

      setTimeout(() => {
        navigate('/app/lab/worklist');
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record results';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading test parameters & analyzer form..." />;
  if (error || !targetItem) return <ErrorState message={error || 'Test investigation not found'} onRetry={refetch} />;

  // Calculate Overall Flag from active parameter flags
  const parameterEvaluations = (testDef.parameters || []).map((p) => {
    const val = paramValues[p.id || p.code];
    return { param: p, val, eval: computeFlag(p, val) };
  });

  const hasCritical = parameterEvaluations.some((e) => e.eval.flag === 'CRITICAL');
  const hasAbnormal = parameterEvaluations.some((e) => e.eval.flag === 'HIGH' || e.eval.flag === 'LOW');

  return (
    <div className="med-page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/worklist')}>
            Back to Worklist
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#8b5cf6' }}>{testDef.code}</span>
        </div>

        <div>
          {existingResult && (
            <Badge variant="warning">Result Entered &bull; Editing Mode</Badge>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Critical Biomarker Live Banner */}
      {hasCritical && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ef4444' }}>
              CRITICAL PANIC VALUE DETECTED
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              One or more measured parameters breached panic thresholds. This finding will automatically alert attending clinicians upon release.
            </p>
          </div>
        </div>
      )}

      {/* Investigation & Patient Header Summary Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  background: 'rgba(124, 58, 237, 0.15)',
                  color: '#8b5cf6',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {testDef.code}
              </span>
              <Badge variant="primary">{testDef.category}</Badge>
              <Badge variant={hasCritical ? 'danger' : hasAbnormal ? 'warning' : 'success'}>
                Live Flag: {hasCritical ? 'CRITICAL' : hasAbnormal ? 'ABNORMAL' : 'NORMAL'}
              </Badge>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {testDef.name}
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diagnostic Order Number</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>
              {order?.orderNumber}
            </div>
          </div>
        </div>

        {/* Patient Demographic Summary Projection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Patient
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {patient?.fullName || 'Patient Name'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              MRN: {patient?.patientId || 'N/A'} &bull; {patient?.gender || 'N/A'}, {patient?.age ? `${patient.age}y` : 'Age N/A'}
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Specimen Tube Spec
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <TestTube size={14} color="#3b82f6" /> {testDef.sampleType || 'Blood'} ({testDef.containerType || 'Standard Specimen Tube'})
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Ordering Physician
            </span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Dr. {order?.orderingDoctor?.user?.fullName || order?.orderingDoctor?.fullName || 'Physician'}
            </div>
          </div>
        </div>
      </Card>

      {/* Parameter Entry Form */}
      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#8b5cf6" /> Measured Parameter Values & Auto-Evaluated Technical Flags
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Units are server-owned. Flags update in real-time as values are entered.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parameterEvaluations.map(({ param, val, eval: evaluation }, idx) => (
              <div
                key={param.id || idx}
                style={{
                  background: evaluation.flag === 'CRITICAL' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255,255,255,0.02)',
                  border: evaluation.flag === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(80px, 0.6fr) minmax(180px, 1.2fr) minmax(130px, 0.8fr)',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                {/* Column 1: Parameter Name & Code */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {param.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8b5cf6', fontFamily: 'monospace' }}>
                    Code: {param.code}
                  </div>
                </div>

                {/* Column 2: Value Input */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Measured Result *
                  </label>
                  {param.dataType === 'NUMERIC' ? (
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 14.5"
                      value={val !== undefined ? val : ''}
                      onChange={(e) => handleValueChange(param.id || param.code, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: evaluation.flag === 'CRITICAL' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. NEGATIVE, NON-REACTIVE"
                      value={val !== undefined ? val : ''}
                      onChange={(e) => handleValueChange(param.id || param.code, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    />
                  )}
                </div>

                {/* Column 3: Server-Owned Unit (Read-only) */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Unit
                  </label>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 8px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {param.unit || '—'}
                  </span>
                </div>

                {/* Column 4: Reference Bounds */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Reference Norms
                  </label>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                    {param.dataType === 'NUMERIC' ? (
                      param.referenceMin !== null && param.referenceMax !== null
                        ? `${param.referenceMin} – ${param.referenceMax} ${param.unit}`
                        : param.referenceMin !== null
                        ? `> ${param.referenceMin} ${param.unit}`
                        : param.referenceMax !== null
                        ? `< ${param.referenceMax} ${param.unit}`
                        : 'Unbounded'
                    ) : (
                      param.normalText || 'Standard norm'
                    )}
                  </div>
                  {(param.criticalLow !== null || param.criticalHigh !== null) && (
                    <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '1px' }}>
                      Panic: {param.criticalLow !== null ? `< ${param.criticalLow}` : ''}
                      {param.criticalLow !== null && param.criticalHigh !== null ? ' | ' : ''}
                      {param.criticalHigh !== null ? `> ${param.criticalHigh}` : ''}
                    </div>
                  )}
                </div>

                {/* Column 5: Computed Technical Flag */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Technical Flag
                  </label>
                  <Badge variant={evaluation.color}>
                    {evaluation.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Result Notes */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Technical Observations & Analyzer Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Analyzed on Sysmex XN-1000, repeat dilution confirmed, no lipemia interference..."
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Correction Reason (Mandatory if correcting existing result) */}
          {existingResult && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                <AlertTriangle size={16} /> Formal Reason for Result Correction *
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                MedCore HMS enforces an immutable audit trail. Any amendment to previously released numbers requires a stated reason.
              </p>
              <input
                type="text"
                required
                placeholder="e.g. Analyzer rerun with 1:2 dilution factor, specimen re-pipetted due to micro-clot..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>
          )}
        </Card>

        {/* Historical Correction Audit Trail Log */}
        {existingResult?.corrections && existingResult.corrections.length > 0 && (
          <Card style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="#f59e0b" /> Immutable Result Amendment History ({existingResult.corrections.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {existingResult.corrections.map((corr) => (
                <div
                  key={corr.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b' }}>
                      Reason: "{corr.reason}"
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(corr.createdAt).toLocaleString()} by {corr.correctedBy?.fullName || 'Technician'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    Diff: {JSON.stringify(corr.diff || {})}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/lab/worklist')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={submitting}
          >
            {submitting ? 'Recording Results...' : existingResult ? 'Save & Log Correction' : 'Submit Analyzer Results'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LabResultEntryPage;
