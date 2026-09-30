export const rolesData = [
  {
    id: "admin",
    name: "Admin dashboard",
    roleTitle: "Hospital Administrator & COO",
    tagline: "Executive oversight, live bed census, financial performance, and governance controls in real time.",
    stats: [
      { label: "Hospital Occupancy", value: "88.4%", change: "+2.1% today", positive: true },
      { label: "Total Active Patients", value: "342", change: "188 IPD / 154 OPD", positive: true },
      { label: "Today's Revenue", value: "$48,920", change: "+12.4% vs target", positive: true },
      { label: "Active Staff on Shift", value: "76", change: "14 Doctors / 42 Nurses", positive: true }
    ],
    previewFeatures: [
      { title: "Real-time Census", desc: "Live ward-by-ward bed occupancy across ICU, General, and Private suites." },
      { title: "Financial Health", desc: "Consolidated billing, claims pending TPA approval, and daily cash collections." },
      { title: "Compliance Radar", desc: "Continuous audit trail monitoring and narcotic register approvals." }
    ],
    mockQueue: [
      { id: "ADM-101", title: "Monthly NABH / JCI Accreditation Report", status: "Audit-Ready", time: "08:30 AM", type: "Governance" },
      { id: "ADM-102", title: "Emergency Ward Surge Capacity Alert (92% full)", status: "Action Needed", time: "09:15 AM", type: "Operations" },
      { id: "ADM-103", title: "TPA Bulk Remittance Reconciliation ($124k)", status: "Approved", time: "10:00 AM", type: "Billing" }
    ],
    sampleActivity: "Dr. Evans authorized ICU Bed transfer for Patient #MC-8921"
  },
  {
    id: "doctor",
    name: "Doctor workspace",
    roleTitle: "Consultant Physician & Surgeon",
    tagline: "High-focus clinical cockpit with instant patient histories, digital prescriptions, and diagnostic reviews.",
    stats: [
      { label: "Today's Appointments", value: "24", change: "8 completed / 16 pending", positive: true },
      { label: "Pending Lab Reviews", value: "7", change: "2 urgent panic alerts", positive: false },
      { label: "Average Consult Time", value: "11 min", change: "Optimal workflow", positive: true },
      { label: "E-Prescriptions Issued", value: "19", change: "100% digital sync", positive: true }
    ],
    previewFeatures: [
      { title: "One-Click Patient Timeline", desc: "Unified history, longitudinal vitals, allergy alerts, and previous visit notes." },
      { title: "Smart Prescription Pad", desc: "Instant drug interaction alerts, formulary stock checks, and voice-to-text dictation." },
      { title: "Integrated PACS & LIS", desc: "View X-rays, CT scans, and lab reports without leaving the consultation note." }
    ],
    mockQueue: [
      { id: "PT-4091", patient: "Sarah Jenkins", age: "42 F", reason: "Post-op Followup · Cardiology", status: "In Room 3", time: "10:15 AM" },
      { id: "PT-4092", patient: "David Miller", age: "58 M", reason: "Hypertension & Chest Tightness", status: "Waiting (5m)", time: "10:30 AM" },
      { id: "PT-4093", patient: "Elena Rostova", age: "31 F", reason: "Routine Antenatal Checkup", status: "Checked In", time: "10:45 AM" }
    ],
    sampleActivity: "Prescribed Atorvastatin 20mg & ordered Lipid Panel for Sarah Jenkins"
  },
  {
    id: "nurse",
    name: "Nurse station",
    roleTitle: "Head Ward Nurse & Triage Specialist",
    tagline: "Fast vitals recording, medication administration schedules (eMAR), and shift handoffs.",
    stats: [
      { label: "Assigned Beds (Ward 3B)", value: "16/18", change: "2 beds available", positive: true },
      { label: "Vitals Due This Hour", value: "5", change: "All on schedule", positive: true },
      { label: "Medication Doses (eMAR)", value: "28", change: "24 given, 4 scheduled", positive: true },
      { label: "Doctor Call Orders", value: "3", change: "New orders received", positive: true }
    ],
    previewFeatures: [
      { title: "Visual Ward Bed Map", desc: "Color-coded patient status, acuity rating, fall risk flags, and isolation warnings." },
      { title: "Digital eMAR", desc: "Barcode scanning of patient wristbands and medication vials to prevent dosage errors." },
      { title: "Shift Handoff Sheet", desc: "Automated SBAR summary generation for seamless nurse shift transition." }
    ],
    mockQueue: [
      { id: "BED-301", patient: "Arthur King (72 M)", vitals: "BP: 128/82 · HR: 74 · SpO2: 98%", task: "IV Antibiotic Due 11:00 AM", status: "On Track" },
      { id: "BED-304", patient: "Maria Santos (49 F)", vitals: "BP: 142/90 · HR: 88 · SpO2: 96%", task: "Post-surgery Wound Dressing", status: "Urgent" },
      { id: "BED-307", patient: "James Cooper (28 M)", vitals: "BP: 118/76 · HR: 68 · SpO2: 99%", task: "Discharge vitals & Paperwork", status: "Ready" }
    ],
    sampleActivity: "Administered Ceftriaxone 1g IV to Arthur King in Bed 301 · Verified by Barcode"
  },
  {
    id: "pharmacy",
    name: "Pharmacy & lab",
    roleTitle: "Chief Pharmacist & Lab Director",
    tagline: "Prescription fulfillment queue, inventory re-ordering, sample barcoding, and analyzer interfacing.",
    stats: [
      { label: "Prescriptions Dispensed", value: "142", change: "Avg 4.2 min turnaround", positive: true },
      { label: "Lab Samples in Process", value: "38", change: "Biochemistry & Hematology", positive: true },
      { label: "Low Stock Items", value: "4", change: "Auto-PO generated", positive: false },
      { label: "Panic Value Alerts", value: "1", change: "Doctor notified automatically", positive: true }
    ],
    previewFeatures: [
      { title: "Direct Rx Dispense Queue", desc: "Digital prescriptions land in the pharmacy queue seconds after doctor confirmation." },
      { title: "Batch & Expiry Automation", desc: "First-Expiry-First-Out (FEFO) dispensing to completely eliminate expired stock loss." },
      { title: "Analyzer Bidirectional Sync", desc: "Direct machine results feed into patient EMR without manual transcription errors." }
    ],
    mockQueue: [
      { id: "RX-8821", doctor: "Dr. Evans", patient: "Sarah Jenkins", items: "Atorvastatin 20mg (#30), Aspirin 75mg", status: "Dispensed", time: "10:18 AM" },
      { id: "LAB-4412", test: "Complete Blood Count (CBC) + ESR", patient: "David Miller", status: "Testing on Sysmex XN", time: "10:22 AM" },
      { id: "RX-8822", doctor: "Dr. Ross", patient: "Marcus Chen", items: "Amoxicillin-Clavulanate 625mg", status: "Ready for Pickup", time: "10:25 AM" }
    ],
    sampleActivity: "Batch auto-validation completed for 16 Lipid Profile analyzer runs"
  },
  {
    id: "frontdesk",
    name: "Front desk",
    roleTitle: "Reception & Patient Admissions Officer",
    tagline: "Rapid patient registration in under 60 seconds, appointment check-ins, queue token generation, and insurance cards.",
    stats: [
      { label: "Today's Patient Check-ins", value: "189", change: "142 Scheduled / 47 Walk-ins", positive: true },
      { label: "Average Check-in Time", value: "48s", change: "Fast-track ID scanning", positive: true },
      { label: "Active Queue in Lobby", value: "11", change: "Low wait time (<8 min)", positive: true },
      { label: "Insurance Pre-Auths", value: "22", change: "20 Approved instantly", positive: true }
    ],
    previewFeatures: [
      { title: "Rapid Intake Scanner", desc: "Scan government ID or insurance card to auto-populate patient profile in seconds." },
      { title: "Smart Token Queue", desc: "SMS token dispatch and interactive waiting room screen integration." },
      { title: "Point of Sale & Deposits", desc: "Accept advance payments, co-pays, and generate thermal receipts on the spot." }
    ],
    mockQueue: [
      { id: "REG-991", patient: "Michael Chang", type: "OPD Consultation", token: "A-44", status: "Sent to Dr. Evans", time: "10:20 AM" },
      { id: "REG-992", patient: "Patricia Moore", type: "Emergency Walk-in", token: "EM-08", status: "Triage Fast-Track", time: "10:24 AM" },
      { id: "REG-993", patient: "Robert Thorne", type: "IPD Admission", token: "ADM-12", status: "Bed Assigned: 402A", time: "10:26 AM" }
    ],
    sampleActivity: "Registered new patient UHID #MC-99412 & verified BlueCross coverage in 42s"
  }
];
