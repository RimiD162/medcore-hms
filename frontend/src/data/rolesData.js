export const rolesData = [
  {
    id: "doctor",
    title: "Doctor",
    subtitle: "Clinical care, diagnosis & prescriptions",
    image: "/images/doctor.jpg",
    accentColor: "#00c9a7",
    glowColor: "rgba(0, 201, 167, 0.35)",
    badgeBg: "rgba(0, 180, 150, 0.25)",
    buttonBg: "#00a88f",
    buttonHover: "#00c9a7",
    iconName: "Stethoscope",
    borderColor: "rgba(0, 201, 167, 0.4)",
    workspaceData: {
      roleTitle: "Physician & Clinical Workspace",
      activePatients: 18,
      pendingReports: 4,
      todayAppointments: 24,
      stats: [
        { label: "Active Consultations", value: "12 / 16", change: "+3 today" },
        { label: "Critical Lab Alerts", value: "2", status: "urgent" },
        { label: "Pending Prescriptions", value: "5", status: "pending" },
        { label: "ICU Bed Rounds", value: "4 Completed", status: "done" }
      ],
      recentPatients: [
        { name: "Robert Sterling", age: 58, gender: "M", diagnosis: "Hypertensive Crisis", room: "ICU-04", status: "Critical" },
        { name: "Elena Rostova", age: 34, gender: "F", diagnosis: "Post-Op Appendectomy", room: "Ward 3B", status: "Stable" },
        { name: "Marcus Vance", age: 42, gender: "M", diagnosis: "Type II Diabetes Review", room: "OPD-102", status: "In Progress" },
        { name: "Sarah Jenkins", age: 29, gender: "F", diagnosis: "Acute Bronchitis", room: "OPD-105", status: "Awaiting Rx" }
      ],
      quickActions: ["New E-Prescription", "Order Lab Test", "Clinical Summary", "Schedule Follow-up", "Discharge Note"]
    }
  },
  {
    id: "nurse",
    title: "Nurse",
    subtitle: "Patient care, vitals & nursing notes",
    image: "/images/nurse.jpg",
    accentColor: "#00b4d8",
    glowColor: "rgba(0, 180, 216, 0.35)",
    badgeBg: "rgba(0, 150, 190, 0.25)",
    buttonBg: "#0096c7",
    buttonHover: "#00b4d8",
    iconName: "HeartPulse",
    borderColor: "rgba(0, 180, 216, 0.4)",
    workspaceData: {
      roleTitle: "Inpatient Care & Triage Station",
      activePatients: 32,
      pendingReports: 7,
      todayAppointments: 40,
      stats: [
        { label: "Ward Occupancy", value: "28 / 32 Beds", change: "88% full" },
        { label: "Vitals Due (Next 30m)", value: "6 Patients", status: "urgent" },
        { label: "IV Infusion Alerts", value: "1 Active", status: "attention" },
        { label: "Shift Handoff Log", value: "Updated 18:45", status: "done" }
      ],
      recentPatients: [
        { name: "David Miller", age: 67, gender: "M", diagnosis: "Post-CABG Day 2", room: "Bed 201", status: "Vitals Due" },
        { name: "Clara Oswald", age: 45, gender: "F", diagnosis: "Pneumonia Treatment", room: "Bed 204", status: "IV Running" },
        { name: "Arthur Pendelton", age: 72, gender: "M", diagnosis: "Orthopedic Recovery", room: "Bed 208", status: "Med Given" },
        { name: "Maya Patel", age: 31, gender: "F", diagnosis: "Maternity Observation", room: "Bed 302", status: "Stable" }
      ],
      quickActions: ["Log Vitals & SpO2", "Administer Medication", "Nurse Shift Handoff", "Call Attending Doc", "Request Bed Clean"]
    }
  },
  {
    id: "receptionist",
    title: "Receptionist",
    subtitle: "Registration, appointments & front desk",
    image: "/images/receptionist.jpg",
    accentColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.35)",
    badgeBg: "rgba(37, 99, 235, 0.25)",
    buttonBg: "#2563eb",
    buttonHover: "#3b82f6",
    iconName: "Users",
    borderColor: "rgba(59, 130, 246, 0.4)",
    workspaceData: {
      roleTitle: "Hospital Front Desk & Queue Hub",
      activePatients: 84,
      pendingReports: 12,
      todayAppointments: 140,
      stats: [
        { label: "Active OPD Queue", value: "19 In Waiting", change: "Avg 12 min" },
        { label: "Walk-in Registrations", value: "62 Today", status: "normal" },
        { label: "Bed Availability", value: "14 General / 3 ICU", status: "done" },
        { label: "Emergency Intakes", value: "3 Pending Triage", status: "urgent" }
      ],
      recentPatients: [
        { name: "Thomas Wright", age: 39, gender: "M", diagnosis: "New Patient Reg", room: "Token #A-42", status: "In Waiting" },
        { name: "Sophia Martinez", age: 24, gender: "F", diagnosis: "Cardiology Follow-up", room: "Token #B-19", status: "With Doctor" },
        { name: "Liam O'Connor", age: 51, gender: "M", diagnosis: "ENT Consultation", room: "Token #C-08", status: "Next in Queue" },
        { name: "Grace Kim", age: 62, gender: "F", diagnosis: "IPD Admission Booking", room: "Token #A-45", status: "Processing" }
      ],
      quickActions: ["Fast Patient Intake", "Issue Queue Token", "Schedule Doctor Slot", "Admit Patient to Ward", "Print ID Wristband"]
    }
  },
  {
    id: "pharmacist",
    title: "Pharmacist",
    subtitle: "Medicines, inventory & dispensing",
    image: "/images/pharmacist.jpg",
    accentColor: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.35)",
    badgeBg: "rgba(16, 185, 129, 0.25)",
    buttonBg: "#059669",
    buttonHover: "#10b981",
    iconName: "Pill",
    borderColor: "rgba(16, 185, 129, 0.4)",
    workspaceData: {
      roleTitle: "Clinical Pharmacy & Dispensary",
      activePatients: 46,
      pendingReports: 3,
      todayAppointments: 92,
      stats: [
        { label: "Pending Prescriptions", value: "8 In Queue", status: "urgent" },
        { label: "Dispensed Today", value: "124 Orders", status: "done" },
        { label: "Low Stock Items", value: "4 Restock Alerts", status: "attention" },
        { label: "Controlled Substance Log", value: "100% Audited", status: "done" }
      ],
      recentPatients: [
        { name: "James Wilson", age: 48, gender: "M", diagnosis: "Amoxicillin 500mg, Paracetamol", room: "Rx #9821", status: "Ready for Pickup" },
        { name: "Emma Watson", age: 37, gender: "F", diagnosis: "Atorvastatin 20mg, Metformin", room: "Rx #9822", status: "Dispensing" },
        { name: "Carlos Ray", age: 65, gender: "M", diagnosis: "Ceftriaxone IV Vials (Ward 4)", room: "Rx #9823", status: "High Priority" },
        { name: "Ananya Sharma", age: 29, gender: "F", diagnosis: "Inhaler Salbutamol & Antihistamine", room: "Rx #9824", status: "Queued" }
      ],
      quickActions: ["Dispense E-Prescription", "Barcode Batch Verification", "Stock Replenishment", "Drug Interaction Check", "Expired Stock Audit"]
    }
  },
  {
    id: "lab_tech",
    title: "Lab Technician",
    subtitle: "Tests, samples & laboratory results",
    image: "/images/lab_tech.jpg",
    accentColor: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.35)",
    badgeBg: "rgba(124, 58, 237, 0.25)",
    buttonBg: "#7c3aed",
    buttonHover: "#8b5cf6",
    iconName: "Microscope",
    borderColor: "rgba(139, 92, 246, 0.4)",
    workspaceData: {
      roleTitle: "Diagnostic Pathology & Biomarker Lab",
      activePatients: 29,
      pendingReports: 14,
      todayAppointments: 68,
      stats: [
        { label: "Pending Test Samples", value: "14 Awaiting Run", status: "urgent" },
        { label: "Completed Assays", value: "54 Verified", status: "done" },
        { label: "Critical Value Flags", value: "1 High Troponin", status: "urgent" },
        { label: "Equipment Calibration", value: "Hematology OK", status: "done" }
      ],
      recentPatients: [
        { name: "Oliver Queen", age: 44, gender: "M", diagnosis: "Complete Blood Count (CBC)", room: "Sample #L-409", status: "Processing" },
        { name: "Natalie Dormer", age: 36, gender: "F", diagnosis: "Comprehensive Metabolic Panel", room: "Sample #L-410", status: "Verified" },
        { name: "Bruce Banner", age: 52, gender: "M", diagnosis: "Serum Cardiac Troponin-I", room: "Sample #L-411", status: "Critical Alert" },
        { name: "Zoe Saldana", age: 41, gender: "F", diagnosis: "Arterial Blood Gas (ABG)", room: "Sample #L-412", status: "In Analyzer" }
      ],
      quickActions: ["Scan Sample Barcode", "Input Test Results", "Flag Critical Value", "Run Auto-Analyzer QC", "Sync with Doctor EMR"]
    }
  },
  {
    id: "accountant",
    title: "Accountant",
    subtitle: "Billing, payments & financial records",
    image: "/images/accountant.jpg",
    accentColor: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.35)",
    badgeBg: "rgba(217, 119, 6, 0.25)",
    buttonBg: "#d97706",
    buttonHover: "#f59e0b",
    iconName: "FileSpreadsheet",
    borderColor: "rgba(217, 119, 6, 0.4)",
    workspaceData: {
      roleTitle: "Revenue Cycle & Billing Operations",
      activePatients: 112,
      pendingReports: 6,
      todayAppointments: 85,
      stats: [
        { label: "Daily Revenue Collected", value: "$48,920.00", change: "+14% vs avg" },
        { label: "Pending Invoices", value: "18 Cleared / 22 Open", status: "normal" },
        { label: "Insurance Claims Filed", value: "34 Submissions", status: "done" },
        { label: "Discharge Clearances", value: "5 Awaiting Signoff", status: "urgent" }
      ],
      recentPatients: [
        { name: "Gregory House", age: 54, gender: "M", diagnosis: "IPD Surgery + 4 Days Room", room: "Bill #INV-8812", status: "$8,450 (Paid)" },
        { name: "Diana Prince", age: 31, gender: "F", diagnosis: "Outpatient MRI & Consult", room: "Bill #INV-8813", status: "$620 (Claimed)" },
        { name: "John Constantine", age: 49, gender: "M", diagnosis: "Emergency Room Triage & Lab", room: "Bill #INV-8814", status: "$1,180 (Pending)" },
        { name: "Natasha Romanoff", age: 38, gender: "F", diagnosis: "Physiotherapy Package (5/10)", room: "Bill #INV-8815", status: "$450 (Paid)" }
      ],
      quickActions: ["Generate Final Bill", "Process TPA Insurance Claim", "Accept POS Payment", "Issue Discharge Clearance", "Export Financial Ledger"]
    }
  }
];

export const bottomFeatures = [
  {
    id: "secure-access",
    title: "Secure Access",
    subtitle: "HIPAA & GDPR 256-bit encrypted data vault",
    iconName: "ShieldCheck"
  },
  {
    id: "connected-workflows",
    title: "Connected Workflows",
    subtitle: "Instant sync between clinical, lab & pharmacy",
    iconName: "Network"
  },
  {
    id: "realtime-operations",
    title: "Real-time Operations",
    subtitle: "Zero-latency live patient telemetry & queue status",
    iconName: "Clock"
  },
  {
    id: "role-based-workspaces",
    title: "Role-based Workspaces",
    subtitle: "Tailored UI optimized for every medical specialist",
    iconName: "Users"
  }
];
