import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  TestTube,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const LabHistoryAuditPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('corrections');

  const { data: samplesData, loading: samplesLoading, error: samplesError, refetch: refetchSamples } = useLabData(
    () => labApi.getSamples({ limit: 100 }),
    []
  );

  const { data: resultsData, loading: resultsLoading, error: resultsError, refetch: refetchResults } = useLabData(
    () => labApi.getResults({ limit: 100 }),
    []
  );

  const samples = samplesData?.samples || [];
  const results = resultsData?.results || [];

  // Extract all corrections across results
  const corrections = [];
  results.forEach((r) => {
    (r.corrections || []).forEach((c) => {
      corrections.push({
        ...c,
        result: r,
        test: r.item?.test,
        order: r.item?.order,
      });
    });
  });

  // Extract all rejected samples
  const rejectedSamples = samples.filter((s) => s.status === 'REJECTED' || s.rejectionReason);

  // Extract recollection linked chains
  const recollections = samples.filter((s) => s.recollectedFromId || s.recollections?.length > 0);

  const loading = samplesLoading || resultsLoading;

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Laboratory Quality & Safety Audit Trail
            </h1>
            <Badge variant="primary">Immutable Governance</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Complete historical audit records of all result amendments, pre-analytical specimen rejections, and recollection linkages.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'corrections', label: `Result Corrections (${corrections.length})` },
          { id: 'rejections', label: `Specimen Rejections (${rejectedSamples.length})` },
          { id: 'recollections', label: `Recollection Chains (${recollections.length})` },
        ]}
      />

      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <LoadingState message="Loading laboratory audit logs & historical diffs..." />
        ) : activeTab === 'corrections' ? (
          /* Tab 1: Result Corrections */
          corrections.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Zero Result Corrections Logged
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                All entered investigation values have maintained first-pass integrity without post-entry edits.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {corrections.map((corr) => (
                <Card key={corr.id} style={{ padding: '16px 20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {corr.test?.name || 'Diagnostic Investigation'} ({corr.test?.code})
                        </span>
                        <Badge variant="warning">AMENDMENT</Badge>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                        Stated Reason: "{corr.reason}"
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Order: <strong style={{ color: '#8b5cf6' }}>{corr.order?.orderNumber}</strong> &bull; Patient: {corr.order?.patient?.fullName || 'Patient'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Corrected by: <strong style={{ color: 'var(--text-primary)' }}>{corr.correctedBy?.fullName || 'Technician'}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {new Date(corr.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Diff Details */}
                  {corr.diff && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      <strong>Parameter Value Diffs:</strong>
                      <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                        {JSON.stringify(corr.diff, null, 2)}
                      </pre>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'rejections' ? (
          /* Tab 2: Specimen Quality Rejections */
          rejectedSamples.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No Rejected Specimens
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                100% of collected specimen tubes met pre-analytical quality criteria.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rejectedSamples.map((sample) => (
                <Card key={sample.id} style={{ padding: '16px 20px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#3b82f6' }}>
                          {sample.sampleCode}
                        </span>
                        <Badge variant="danger">REJECTED</Badge>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sample.sampleType} &bull; {sample.containerType || 'Tube'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                        Quality Breach: {sample.rejectionReason}
                      </div>

                      {sample.rejectionNotes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Lab Observations: "{sample.rejectionNotes}"
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Patient: <strong>{sample.patient?.fullName || 'Patient'}</strong> &bull; Order: {sample.order?.orderNumber}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Rejected by: <strong style={{ color: 'var(--text-primary)' }}>{sample.rejectedBy?.fullName || 'Lab Staff'}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {sample.rejectedAt ? new Date(sample.rejectedAt).toLocaleString() : 'Recent'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          /* Tab 3: Recollection Chains */
          recollections.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
              <RotateCcw size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No Active Recollections
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                Recollections generated from specimen rejections will link here.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recollections.map((sample) => (
                <Card key={sample.id} style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#3b82f6' }}>
                          {sample.sampleCode}
                        </span>
                        <Badge variant="primary">RECOLLECTION TUBE</Badge>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                        Specimen: {sample.sampleType} &bull; Patient: <strong>{sample.patient?.fullName || 'Patient'}</strong>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Linked to Diagnostic Order: <strong style={{ color: '#8b5cf6' }}>{sample.order?.orderNumber}</strong>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/lab/samples/${sample.id}`)}
                    >
                      Track Tube Custody &rarr;
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LabHistoryAuditPage;
