# MedCore HMS — Enterprise Hospital Management System

MedCore HMS is an enterprise-grade, integrated Hospital Management System frontend built with React, Vite, and modern design tokens, engineered around **connected hospital workflows** rather than isolated CRUD screens.

---

## 📖 Complete 21-Phase Implementation Plan

For the comprehensive A-to-Z breakdown of all 21 phases (Phase 0 through Phase 20), please see:
👉 **[`IMPLEMENTATION_PLAN.md`](file:///c:/Users/rimid/OneDrive/Desktop/medcore-hms/IMPLEMENTATION_PLAN.md)**

### Centerpiece Clinical Workflows
1. **Outpatient (OPD) Workflow:**  
   $$\text{Registration} \longrightarrow \text{Appointment} \longrightarrow \text{Consultation} \longrightarrow \text{EMR} \longrightarrow \text{Digital Prescription} \longrightarrow \text{Billing}$$
2. **Laboratory (LIS) Workflow:**  
   $$\text{Doctor Order} \longrightarrow \text{Sample Collection} \longrightarrow \text{Lab Processing} \longrightarrow \text{Result Entry} \longrightarrow \text{Verified Report} \longrightarrow \text{EMR Sync}$$
3. **Inpatient (IPD) Workflow:**  
   $$\text{Admission} \longrightarrow \text{Bed Assignment} \longrightarrow \text{Nurse Station Vitals} \longrightarrow \text{Doctor Care} \longrightarrow \text{Auto-Billing} \longrightarrow \text{Discharge}$$

---

## 🗺️ Phases Summary (0 to 20)

| Phase | Milestone | Key Deliverable |
| :--- | :--- | :--- |
| **0** | **Foundation** | Project structure, UI design system, base components & shell |
| **1** | **Authentication + RBAC** | Secure JWT auth & 7 role tiers (Admin, Doctor, Nurse, Front Desk, Pharmacist, Lab, Accountant) |
| **2** | **Hospital Core** | Master departments, doctor availability, patient profiles & unified timeline |
| **3** | **Appointments** | Doctor schedule engine, time slots, calendar & lifecycle states |
| **4** | **Clinical Workflow / EMR** | Symptoms, vitals, diagnosis (ICD-10), clinical notes & treatment plans |
| **5** | **Digital Prescriptions** | Formulary lookup, dosage/frequency calculations & printable orders |
| **6** | **Pharmacy Management** | Batch/FEFO expiry tracking, dispensing queues & auto stock decrement |
| **7** | **Laboratory Management** | Diagnostic test catalog, barcode sample intake, machine results & reports |
| **8** | **Beds / IPD** | Visual ward/bed status grid, admission (ADT), transfers & discharge |
| **9** | **Billing & Payments** | Automated multi-service invoice aggregation, partial payments & receipts |
| **10** | **Nursing Management** | Ward stations, assigned patient vitals monitoring & digital eMAR |
| **11** | **Emergency Management** | Triage priority coding (Levels 1-4), trauma bays & rapid physician dispatch |
| **12** | **Insurance** | Policy coverage, TPA packages, pre-authorization & claim adjudication |
| **13** | **Notifications** | Real-time cross-module event triggers (lab panic values, bed alerts) |
| **14** | **Global Search & Filtering** | Universal search across patients, doctors, records, and invoices |
| **15** | **Reports & Analytics** | Executive census, occupancy rates, financial KPIs & BI dashboards |
| **16** | **Document Management** | Encrypted medical scans, lab PDFs, consent forms & access controls |
| **17** | **Audit Logs** | Cryptographically stamped tamper-proof event trail for all actions |
| **18** | **Hospital Settings** | Department configs, fee schedules, consultation rules & branding |
| **19** | **Security Hardening** | Route protection, input validation, rate limiting & error handling |
| **20** | **Testing & Final Demo** | E2E test suites, realistic demo seeds, UI polish & production readiness |

---

## 📁 Repository Structure

```
medcore-hms/
├── IMPLEMENTATION_PLAN.md            # Master A-to-Z Phase 0 to 20 Architecture Plan
├── README.md                         # Project documentation
├── frontend/                         # React + Vite Frontend Application
│   ├── public/
│   │   └── assets/                   # Medical photography assets
│   │       ├── doctor-hero.jpg
│   │       └── hospital-team.jpg
│   ├── src/
│   │   ├── components/               # React UI Components
│   │   │   ├── Navbar.jsx            # Responsive header with live status
│   │   │   ├── HeroSection.jsx       # Editorial hero with EHR sync indicator
│   │   │   ├── MetricsBar.jsx        # 4-column operational metrics (23/8/4/24x7)
│   │   │   ├── ModularFeaturesSection.jsx # 3 Core modular category cards (01, 02, 03)
│   │   │   ├── RoleWorkspacesSection.jsx  # Role selector with team visual
│   │   │   ├── InteractiveRolePreview.jsx # Real-time interactive role simulator
│   │   │   ├── CtaSection.jsx        # Enterprise call to action
│   │   │   ├── Footer.jsx            # Navigation and copyright footer
│   │   │   ├── BookDemoModal.jsx     # Interactive demo reservation modal
│   │   │   ├── ExploreModulesModal.jsx # 23-Module searchable explorer
│   │   │   └── ContactModal.jsx      # Enterprise advisory consultation modal
│   │   ├── data/
│   │   │   ├── modulesData.js        # 23 Hospital modules & rollout phases
│   │   │   └── rolesData.js          # 5 Role simulator datasets with live queues
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example                  # Environment configuration template
│   ├── .env                          # Local environment variables
│   └── .gitignore
└── .gitignore
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Running the Frontend
```bash
# 1. Navigate into the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be accessible at:
```
http://localhost:5173/ (or http://localhost:5174/)
```

### Production Build
```bash
cd frontend
npm run build
npm run preview
```
