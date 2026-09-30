import React from 'react';
import {
  Activity,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Layers,
  FileCheck,
} from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      icon: Layers,
      title: 'Unified Hospital Ecosystem',
      desc: 'Connects outpatients, emergency rooms, inpatient wards, ICU, operating theaters, and discharge in one synchronized database.',
    },
    {
      icon: Cpu,
      title: 'AI Diagnostic Assistance',
      desc: 'Automatic cross-referencing of lab flags, patient history, and drug-drug interactions in real time for clinicians.',
    },
    {
      icon: RefreshCw,
      title: 'Zero-Latency Workflow Sync',
      desc: 'Orders placed by doctors instantly flash on pharmacy dispensers and laboratory sample queues with zero manual paperwork.',
    },
    {
      icon: ShieldAlert,
      title: 'HIPAA & NABH Tier-4 Security',
      desc: 'End-to-end 256-bit encryption with cryptographic role-based access control, tamper-proof audit trails, and biometric auth.',
    },
    {
      icon: Activity,
      title: 'Telemetry & IoT Integration',
      desc: 'Seamless ingestion of live patient monitoring data from GE, Philips, and Mindray ICU monitors directly into nursing charts.',
    },
    {
      icon: FileCheck,
      title: 'Automated TPA & Insurance Desk',
      desc: 'Instant cashless claim processing, pre-authorization workflows, and seamless integration with national health registries.',
    },
  ];

  return (
    <section id="features" className="info-section">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span className="section-badge">Enterprise Capabilities</span>
        <h2 className="section-heading">Built for High-Throughput Modern Hospitals</h2>
        <p className="section-subheading" style={{ margin: '0 auto' }}>
          Eliminate data silos, reduce patient wait times by 65%, and ensure clinical precision across every care unit.
        </p>
      </div>

      <div className="info-cards-grid">
        {features.map((feat, idx) => {
          const IconComp = feat.icon;
          return (
            <div key={idx} className="info-box">
              <div className="info-box-icon">
                <IconComp size={22} />
              </div>
              <h3 className="info-box-title">{feat.title}</h3>
              <p className="info-box-desc">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturesSection;
