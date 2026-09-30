import React, { useState } from 'react';
import {
  Building2,
  BedDouble,
  FileHeart,
  Pill,
  Microscope,
  CreditCard,
  Video,
  Truck,
  CheckCircle,
} from 'lucide-react';

export const ModulesSection = ({ onSelectModuleWorkspace }) => {
  const [activeTab, setActiveTab] = useState('clinical');

  const clinicalModules = [
    {
      icon: FileHeart,
      title: 'Electronic Health Records (EHR / EMR)',
      highlights: ['SNOMED & ICD-11 coded charts', 'Voice-to-text clinical notes', 'One-click longitudinal patient summary'],
    },
    {
      icon: BedDouble,
      title: 'Inpatient & Ward Management (IPD)',
      highlights: ['Visual 2D bed board with color tags', 'Nurse shift handover logs', 'Infusion rate & vitals tracking'],
    },
    {
      icon: Video,
      title: 'Telemedicine & Remote Consultation',
      highlights: ['HD WebRTC secure video consults', 'In-call digital prescription', 'Patient portal sync'],
    },
  ];

  const operationsModules = [
    {
      icon: Building2,
      title: 'Outpatient Department (OPD Queue)',
      highlights: ['Smart token allocation kiosk', 'Doctor room display integrations', 'SMS & WhatsApp appointment updates'],
    },
    {
      icon: Microscope,
      title: 'Laboratory Information System (LIS)',
      highlights: ['Bi-directional analyzer interfacing', 'Barcode sample tracking', 'Critical value SMS alerts'],
    },
    {
      icon: Pill,
      title: 'Pharmacy & Dispensing Inventory',
      highlights: ['FEFO / FIFO batch expiry controls', 'Drug interaction warnings', 'Automated purchase orders'],
    },
  ];

  const financialModules = [
    {
      icon: CreditCard,
      title: 'Revenue Cycle & Billing Hub',
      highlights: ['Split billing (Patient + Insurer)', 'Automated tariff calculations', 'Multi-currency POS & Gateway'],
    },
    {
      icon: Truck,
      title: 'Hospital Supply Chain & Assets',
      highlights: ['Equipment preventive maintenance', 'Departmental requisition approvals', 'Central store vendor catalog'],
    },
  ];

  return (
    <section id="modules" className="info-section">
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span className="section-badge">Modular Architecture</span>
        <h2 className="section-heading">Comprehensive Hospital Management Suites</h2>
        <p className="section-subheading" style={{ margin: '0 auto 24px' }}>
          Deploy standalone modules or the complete integrated hospital ERP suite.
        </p>

        {/* Tab Filter */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '9999px', gap: '4px' }}>
          {[
            { id: 'clinical', label: 'Clinical Modules' },
            { id: 'operations', label: 'Operations & Labs' },
            { id: 'financial', label: 'Financial & Assets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #00c9a7, #06b6d4)' : 'transparent',
                color: activeTab === tab.id ? '#041926' : '#94a3b8',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="info-cards-grid">
        {(activeTab === 'clinical'
          ? clinicalModules
          : activeTab === 'operations'
          ? operationsModules
          : financialModules
        ).map((mod, idx) => {
          const IconComp = mod.icon;
          return (
            <div key={idx} className="info-box">
              <div className="info-box-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                <IconComp size={22} />
              </div>
              <h3 className="info-box-title">{mod.title}</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {mod.highlights.map((item, hIdx) => (
                  <li key={hIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                    <CheckCircle size={14} color="#00d2b4" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ModulesSection;
