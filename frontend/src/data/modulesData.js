export const modulesCategories = [
  {
    id: "01",
    name: "Clinical care",
    tagline: "Everything a care team touches in a consultation, from first registration to follow-up.",
    phase: "Phase 1: Core Foundation",
    items: [
      {
        id: "m-reg",
        title: "Patient registration & profiles",
        description: "Unified digital patient identity, demographic records, biometric IDs, emergency contacts, and complete medical timeline.",
        badge: "Core",
        features: ["Unique Health ID (UHID)", "Photo & ID capture", "Family linking & guardian consent", "Duplicate record detection"]
      },
      {
        id: "m-apt",
        title: "Appointments & doctor schedules",
        description: "Multi-department doctor schedule management, queue token display, walk-in slots, and automated SMS reminders.",
        badge: "Core",
        features: ["Intelligent slot management", "Doctor leave calendar", "Real-time queue TV display", "Patient reschedule portal"]
      },
      {
        id: "m-emr",
        title: "Electronic medical records (EMR)",
        description: "Comprehensive clinical encounter notes, diagnostic history, vitals trending, allergy alerts, and longitudinal record timeline.",
        badge: "Clinical",
        features: ["ICD-10 & SNOMED CT coding", "Specialty-specific templates", "Past medical timeline", "Clinical decision support"]
      },
      {
        id: "m-rx",
        title: "Digital prescriptions",
        description: "Instant electronic prescribing with built-in drug-drug interaction warnings, dosage calculators, and pharmacy direct sync.",
        badge: "Clinical",
        features: ["Drug interaction engine", "Hospital formulary lookup", "Multi-lingual dosage prints", "Repeat prescription workflows"]
      },
      {
        id: "m-dash",
        title: "Doctor & nurse dashboards",
        description: "Role-tailored clinical cockpits displaying waiting rooms, pending lab reviews, inpatient rounds, and critical alert feeds.",
        badge: "Care Team",
        features: ["Priority triage indicators", "Rapid note dictation", "One-click order entry", "Shift handoff summaries"]
      }
    ]
  },
  {
    id: "02",
    name: "Hospital operations",
    tagline: "The departments that keep a hospital physically running, day and night.",
    phase: "Phase 2: Operations & Inpatient",
    items: [
      {
        id: "m-pharm",
        title: "Pharmacy & medicine inventory",
        description: "End-to-end pharmaceutical lifecycle from bulk procurement, batch/expiry tracking, unit-dose dispensing to point-of-sale retail.",
        badge: "Logistics",
        features: ["Batch & FEFO expiry automation", "Automated reorder triggers", "Narcotics register & audit", "Supplier PO generation"]
      },
      {
        id: "m-lab",
        title: "Laboratory tests & reports",
        description: "LIS workflow covering test ordering, barcode specimen tracking, analyzer machine bidirectional interfacing, and digital verified reports.",
        badge: "Diagnostics",
        features: ["HL7 analyzer interfacing", "Barcode tube labels", "Panic value SMS alerts", "Pathologist digital signature"]
      },
      {
        id: "m-ipd",
        title: "Bed, ward & IPD management",
        description: "Visual floor-by-floor bed grid, admission/transfer/discharge (ADT) workflows, ICU monitors, and nurse shift allocations.",
        badge: "Inpatient",
        features: ["Live visual ward map", "Bed occupancy analytics", "Discharge summary generator", "Inpatient dietary orders"]
      },
      {
        id: "m-emg",
        title: "Departments & emergency workflow",
        description: "Triage coding (Red/Yellow/Green), trauma bay tracking, swift emergency intake, and rapid multi-specialty consult dispatches.",
        badge: "Emergency",
        features: ["Manchester triage scoring", "Crash cart checklist", "Rapid admission bypass", "Code blue notification broadcast"]
      },
      {
        id: "m-doc",
        title: "Secure document management",
        description: "Encrypted repository for medical scans, signed consent forms, discharge papers, insurance vouchers, and physical document archiving.",
        badge: "Archive",
        features: ["OCR paper scanner integration", "Encrypted cloud storage", "Watermarked PDF export", "Legal retention compliance"]
      }
    ]
  },
  {
    id: "03",
    name: "Revenue & governance",
    tagline: "Financial control and accountability, visible to administrators in real time.",
    phase: "Phase 3: Financial & Governance",
    items: [
      {
        id: "m-bill",
        title: "Billing, invoices & payments",
        description: "Itemized billing for consultations, bed days, pharmacy, labs, and OT with support for split payments, credit notes, and online gateways.",
        badge: "Finance",
        features: ["Unified folio billing", "Multiple payment gateways", "Deposit & advance management", "Tax & discount rules"]
      },
      {
        id: "m-ins",
        title: "Insurance profiles & claims",
        description: "Direct cashless claim adjudication, TPA integration, pre-authorization document builder, and remittance reconciliation.",
        badge: "Revenue",
        features: ["TPA package pricing", "Pre-auth tracker", "Denial management workflow", "Electronic claim submission"]
      },
      {
        id: "m-rep",
        title: "Reports & analytics dashboards",
        description: "Executive business intelligence, bed occupancy rates, revenue per bed, physician productivity, and clinical outcome metrics.",
        badge: "Analytics",
        features: ["Daily hospital census", "Revenue leakage detection", "Custom report builder", "Automated email summaries"]
      },
      {
        id: "m-rbac",
        title: "Role-based access control",
        description: "Granular multi-tiered permission matrix ensuring staff only see data required for their specific duty and shift.",
        badge: "Security",
        features: ["Fine-grained field permissions", "2-Factor Authentication (2FA)", "Single Sign-On (SAML/OAuth)", "Department scoping"]
      },
      {
        id: "m-audit",
        title: "Full audit logs",
        description: "Immutable cryptographically stamped access and mutation records tracking every patient record read, write, or export event.",
        badge: "Compliance",
        features: ["HIPAA / GDPR compliance", "Tamper-proof changelog", "IP & device fingerprinting", "Forensic event search"]
      }
    ]
  },
  {
    id: "04",
    name: "Specialized & Enterprise modules",
    tagline: "High-value advanced modules that scale with large tertiary hospitals and multi-center networks.",
    phase: "Phase 4: Network & Specialized",
    items: [
      {
        id: "m-ot",
        title: "Operation Theatre & Surgery Management",
        description: "Surgical schedule booking, surgeon/anaesthetist rosters, pre-op checklists, implant tracking, and PACU recovery notes.",
        badge: "Surgical",
        features: ["WHO surgical safety checklist", "Implant barcode tracking", "OT sterilisation logs", "Anaesthesia record chart"]
      },
      {
        id: "m-pacs",
        title: "Radiology & DICOM PACS Viewer",
        description: "Embedded zero-footprint DICOM viewer for X-Rays, CT Scans, and MRIs with remote teleradiology reading capability.",
        badge: "Radiology",
        features: ["Web DICOM 3.0 viewer", "Window/level adjustments", "Radiologist audio dictation", "Multi-modality worklist"]
      },
      {
        id: "m-blood",
        title: "Blood Bank & Transfusion Logistics",
        description: "Donor screening, cross-matching, blood component fractionation, refrigerator temperature alerts, and transfusion audits.",
        badge: "Blood Bank",
        features: ["Crossmatch safety verify", "Component separation logs", "Expiry alerts by blood group", "ISBT 128 barcode format"]
      },
      {
        id: "m-diet",
        title: "Dietary & Nutrition Kitchen Management",
        description: "Therapeutic diet planning, patient allergy screening, meal tray distribution, and hospital kitchen inventory.",
        badge: "Nutritional",
        features: ["Diabetic / Renal diet tags", "Ward meal dispatch route", "Nutritional calorie metrics", "Doctor dietary orders"]
      },
      {
        id: "m-tele",
        title: "Telemedicine & Remote Consultation",
        description: "Encrypted HD video consultation with doctor screen sharing, integrated e-prescriptions, and mobile patient app link.",
        badge: "Telehealth",
        features: ["WebRTC video encrypted", "In-call note taking", "Digital prescription SMS", "Payment gateway before call"]
      },
      {
        id: "m-fleet",
        title: "Ambulance & Emergency Dispatch",
        description: "GPS live ambulance tracking, paramedic triage sync with ER trauma team, and emergency route optimization.",
        badge: "Fleet",
        features: ["Live GPS map tracking", "In-transit telemetry sync", "Emergency dispatch token", "Oxygen/equipment checklist"]
      },
      {
        id: "m-asset",
        title: "Biomedical Asset Maintenance & Calibration",
        description: "Hospital machinery preventative maintenance, calibration logs, breakdown tickets, and AMC vendor contracts.",
        badge: "Bio-Med",
        features: ["QR asset tagging", "Preventive schedule alerts", "Breakdown downtime logs", "Vendor warranty tracker"]
      },
      {
        id: "m-app",
        title: "Patient Mobile Portal & Self-Service Kiosk",
        description: "Patient facing app for self check-in, test report download, appointment booking, and bill payments.",
        badge: "Patient Portal",
        features: ["Digital token queue", "Download lab PDFs", "Online doctor appointment", "Prescription refill requests"]
      }
    ]
  }
];

export const allModulesCount = 23;
export const allStaffRolesCount = 8;
export const allPhasesCount = 4;
