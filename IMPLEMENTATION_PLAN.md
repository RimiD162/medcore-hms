# MedCore HMS — Phase-by-Phase Feature Implementation Plan

> **Core Architectural Principle:** Build **connected hospital workflows**, not just separate CRUD pages.  
> **Key Centerpiece Workflows:** Outpatient (OPD) Consultation, Laboratory Workflow, and Inpatient (IPD) Workflow.

---

## 🗺️ Master Implementation Roadmap (Phases 0 → 20)

| Phase | Focus Area | Main Outcome / Milestone |
| :--- | :--- | :--- |
| **Phase 0** | **Foundation** | Project structure, shared UI design system, API/database base |
| **Phase 1** | **Authentication + RBAC** | Secure login, session tokens, and 7 role-specific access tiers |
| **Phase 2** | **Hospital Core** | Departments, doctor profiles, patient registration & central timeline |
| **Phase 3** | **Appointments** | Doctor availability slots, scheduling, calendar & status workflow |
| **Phase 4** | **Clinical Workflow / EMR** | Symptoms, vitals, diagnosis, notes, and longitudinal timeline |
| **Phase 5** | **Digital Prescriptions** | Structured prescribing, dosage, duration, linked to pharmacy |
| **Phase 6** | **Pharmacy Management** | Medicine catalog, batch/expiry alerts, stock dispensing & auto-billing |
| **Phase 7** | **Laboratory Management** | Lab test catalog, orders, sample collection, results & reports |
| **Phase 8** | **Beds / IPD** | Visual ward/bed grid, patient admission, transfers & discharge |
| **Phase 9** | **Billing & Payments** | Unified itemized invoices, partial payments & service charge aggregation |
| **Phase 10** | **Nursing Management** | Nurse stations, assigned beds, vitals tracking, eMAR & notes |
| **Phase 11** | **Emergency Management** | Triage priority levels, rapid doctor/bed assignment & trauma notes |
| **Phase 12** | **Insurance** | Policy coverage, pre-auth claims, adjudication & approval states |
| **Phase 13** | **Notifications** | Real-time cross-module operational alerts & reminders |
| **Phase 14** | **Global Search & Filtering** | Universal search across patients, doctors, records, and invoices |
| **Phase 15** | **Reports & Analytics** | Executive census, occupancy rates, financial KPIs & BI dashboards |
| **Phase 16** | **Document Management** | Encrypted medical scans, lab PDFs, consent forms & access controls |
| **Phase 17** | **Audit Logs** | Cryptographically stamped tamper-proof event trail for all actions |
| **Phase 18** | **Hospital Settings** | Department configs, fee schedules, consultation rules & branding |
| **Phase 19** | **Security Hardening** | Route protection, input validation, rate limiting & error handling |
| **Phase 20** | **Testing, Stabilization & Demo** | E2E test suites, realistic demo seeds, UI polish & production readiness |

---

## 🏗️ Detailed Phase Specifications (A to Z)

```
                       ┌─────────────────────────┐
                       │  Phase 0: Foundation    │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Phase 1: Auth & RBAC   │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Phase 2: Hospital Core │ (Central Hub: Patient Profile)
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────▼────────┐        ┌────────▼────────┐        ┌────────▼────────┐
│  Phase 3-5: OPD │        │ Phase 6-7: LIS  │        │  Phase 8-10: IPD│
│ Clinical Care   │        │ & Pharmacy      │        │ & Inpatient     │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ Phase 9, 11-13: Revenue │
                       │ Emergency & Alerts      │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ Phase 14-18: Analytics, │
                       │ Documents & Audit Logs  │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ Phase 19-20: Security,  │
                       │ Testing & Final Demo    │
                       └─────────────────────────┘
```

---

### Phase 0: Foundation
* **Objective:** Create the reusable technical base before implementing hospital business modules.
* **Features to Implement:**
  - Project structure and routing architecture
  - Frontend layout with responsive navbar, sidebar, and application shell
  - Backend API structure and standard response envelopes
  - Database connection, migrations, and base ORM models
  - Reusable UI primitives: buttons, cards, data tables, forms, badges, modals
  - Loading skeletons, empty states, validation-error banners, success/failure toasts
  - Responsive design across mobile, tablet, and widescreen clinical displays
* **Recommended Workflow:**
  $$\text{Landing Page} \longrightarrow \text{Login} \longrightarrow \text{Application Shell} \longrightarrow \text{Dashboard}$$
* **Impact / Demo Value:** Prevents duplicated UI logic and makes every subsequent module significantly faster to build and maintain.

---

### Phase 1: Authentication + RBAC
* **Objective:** Secure the system and establish granular, role-specific access controls.
* **Features to Implement:**
  - User registration, login, and secure logout
  - Password hashing (Argon2 / BCrypt) and credential validation
  - Session and JWT token lifecycle management (access + refresh tokens)
  - Forgot password and secure reset token flow
  - Account activation, deactivation, and lockout policies
  - **7 Core Hospital Roles:**
    1. *Hospital Admin* (Executive & Governance)
    2. *Doctor* (Consultations & Clinical Orders)
    3. *Nurse* (Ward Stations, Vitals & eMAR)
    4. *Receptionist* (Front Desk, Intake & Tokens)
    5. *Pharmacist* (Inventory & Prescription Dispense)
    6. *Lab Technician* (Sample Intake & Diagnostic Entry)
    7. *Accountant* (Billing, Folios & Claims)
  - Backend permission middleware and frontend protected route guards
* **Recommended Workflow:**
  $$\text{User} \longrightarrow \text{Login} \longrightarrow \text{Role Detected} \longrightarrow \text{Role-Specific Dashboard} \longrightarrow \text{Authorized API Actions}$$
* **Impact / Demo Value:** Establishes a rock-solid security perimeter and demonstrates real role-based permission segregation.

---

### Phase 2: Hospital Core
* **Objective:** Build the foundational master hospital datasets that all other clinical and operational workflows depend on.
* **Features to Implement:**
  - Department and specialty management (Cardiology, Orthopedics, Pediatrics, etc.)
  - Doctor profiles, qualifications, licensing, and departmental allocations
  - Doctor availability schedules and standard shift timings
  - Patient registration with Unique Health ID (UHID) generation
  - Comprehensive patient profile (demographics, emergency contacts, blood group)
  - Medical history, chronic conditions, and critical allergy warnings
  - Central unified patient timeline/hub
* **Recommended Workflow:**
  $$\text{Department} \longrightarrow \text{Doctor} \longrightarrow \text{Patient} \longrightarrow \text{Patient Profile (Central Hub)}$$
* **Impact / Demo Value:** The **Patient Profile** becomes the master anchor connecting appointments, EMR notes, prescriptions, laboratory orders, and financial invoices.

---

### Phase 3: Appointment Management
* **Objective:** Turn doctor availability and patient profiles into a functioning scheduling engine.
* **Features to Implement:**
  - Appointment booking for walk-ins and pre-booked visits
  - Multi-doctor schedule calendars with automated slot generation
  - Configurable consultation duration time slots (e.g., 15m / 30m)
  - Interactive calendar views (day, week, month, doctor grid)
  - Search, department filters, and doctor availability filters
  - Reschedule and cancellation workflows with reason tracking
  - Appointment lifecycle states: `Scheduled` $\rightarrow$ `Confirmed` $\rightarrow$ `In-Consultation` $\rightarrow$ `Completed` $\rightarrow$ `Cancelled` $\rightarrow$ `No-show`
* **Recommended Workflow:**
  $$\text{Patient + Doctor + Availability} \longrightarrow \text{Available Slot} \longrightarrow \text{Appointment Confirmed}$$
* **Impact / Demo Value:** Enforces real-world clinical business logic by preventing double-booking and bookings outside active doctor duty hours.

---

### Phase 4: Clinical Workflow / EMR
* **Objective:** Create the doctor-patient clinical consultation interface and Electronic Medical Records (EMR).
* **Features to Implement:**
  - Chief complaints and symptom recording
  - Vital signs recording (Blood Pressure, Heart Rate, SpO2, Temperature, Respiratory Rate, BMI)
  - Primary and differential diagnosis entry (ICD-10 / SNOMED CT coded)
  - Rich clinical notes, physical examination findings, and assessment
  - Structured treatment plan recommendations
  - Scheduled follow-up date selector
  - Chronological longitudinal medical timeline and visit history
* **Recommended Workflow:**
  $$\text{Appointment} \longrightarrow \text{Doctor Consultation} \longrightarrow \text{EMR} \longrightarrow \text{Diagnosis} \longrightarrow \text{Treatment Plan}$$
* **Impact / Demo Value:** Elevates the application from a simple administrative database into a true clinical encounter system.

---

### Phase 5: Digital Prescriptions
* **Objective:** Allow physicians to generate structured, legally valid electronic prescriptions directly from consultations.
* **Features to Implement:**
  - Fast medicine lookup from the hospital formulary
  - Structured dosage (e.g., 500mg), frequency (e.g., 1-0-1 / TID), and duration (e.g., 5 days)
  - Patient administration instructions (e.g., "Take after meals with water")
  - Historical prescription record viewer
  - High-resolution printable prescription format with hospital letterhead and doctor signature
  - Real-time prescription lifecycle statuses: `Created` $\rightarrow$ `Sent to Pharmacy` $\rightarrow$ `Dispensed`
* **Recommended Workflow:**
  $$\text{Doctor} \longrightarrow \text{Patient} \longrightarrow \text{Diagnosis} \longrightarrow \text{Prescription} \longrightarrow \text{Pharmacy Queue}$$
* **Impact / Demo Value:** Establishes seamless real-time interoperability between consultation rooms and the pharmacy department.

---

### Phase 6: Pharmacy Management
* **Objective:** Manage pharmaceutical inventory and automatically link medication dispensing with clinical prescriptions.
* **Features to Implement:**
  - Master medicine catalog with generics, brands, forms (tablet, syrup, IV), and manufacturers
  - Batch number tracking with manufacturing and expiry dates (FEFO logic)
  - Stock in (purchase orders / supplier intake) and stock out logs
  - Live inventory tracking across main pharmacy and satellite emergency counters
  - Automated low-stock threshold alerts
  - Expiry alert warning system (30 / 60 / 90 days prior)
  - Digital prescription fulfillment and dispensing queue
  - Automatic inventory decrement upon dispensing
* **Recommended Workflow:**
  $$\text{Prescription} \longrightarrow \text{Pharmacist Queue} \longrightarrow \text{Dispense Batch} \longrightarrow \text{Stock Decrements} \longrightarrow \text{Auto-Bill Entry}$$
* **Impact / Demo Value:** Demonstrates high-value operational integration where a clinical order immediately affects inventory numbers and financial ledger balances.

---

### Phase 7: Laboratory Management
* **Objective:** Create an end-to-end Laboratory Information System (LIS) order-to-result cycle.
* **Features to Implement:**
  - Diagnostic test and panel catalog (CBC, Lipid Profile, LFT, KFT, Urinalysis, etc.) with normal reference ranges
  - Doctor electronic lab order generation
  - Phlebotomy sample collection tracking with unique barcode generation
  - Laboratory processing status updates
  - Numerical and qualitative result entry with automated panic/abnormal flag indicators
  - Verified digital lab reports with pathologist digital sign-off
  - Real-time test progress tracking: `Ordered` $\rightarrow$ `Sample Collected` $\rightarrow$ `In-Processing` $\rightarrow$ `Result Entered` $\rightarrow$ `Verified & Published`
* **Recommended Workflow:**
  $$\text{Doctor} \longrightarrow \text{Lab Order} \longrightarrow \text{Sample Collected} \longrightarrow \text{Processing} \longrightarrow \text{Result Entry} \longrightarrow \text{Published Report} \longrightarrow \text{EMR Sync}$$
* **Impact / Demo Value:** Completes a cross-departmental diagnostic loop that automatically appends verified test results to the patient's EMR timeline.

---

### Phase 8: Beds / Inpatient (IPD)
* **Objective:** Support inpatient admissions, visual bed census management, ward transfers, and discharges.
* **Features to Implement:**
  - Ward hierarchies (General, Semi-Private, Deluxe, ICU, CCU, Post-Op)
  - Room and bed inventory configuration
  - Interactive visual color-coded Bed Status Map (Available, Occupied, Reserved, Cleaning, Maintenance)
  - Inpatient Admission (ADT) workflow from OPD or Emergency
  - Attending physician and primary nurse assignment
  - Bed-to-bed and ward-to-ward transfer management
  - Discharge planning and discharge summary builder
  - Automated bed release and housekeeping turnaround triggers
* **Recommended Workflow:**
  $$\text{Patient} \longrightarrow \text{Admission} \longrightarrow \text{Ward/Room/Bed Assigned} \longrightarrow \text{Inpatient Care} \longrightarrow \text{Discharge} \longrightarrow \text{Bed Available}$$
* **Impact / Demo Value:** The visual bed grid provides an immediate, compelling executive demonstration of live hospital occupancy.

---

### Phase 9: Billing & Payments
* **Objective:** Automatically aggregate hospital services, medications, diagnostics, and room charges into unified patient invoices.
* **Features to Implement:**
  - Master service tariff and charge configuration
  - Automated consultation fee capture
  - Laboratory test auto-billing integration
  - Pharmacy dispensed medicine auto-billing integration
  - Daily room and bed night charge calculations
  - Consolidated folio invoice generation
  - Multi-mode payment recording (Cash, Credit Card, UPI, Bank Wire)
  - Support for partial payments, deposits, and advance balances
  - Real-time outstanding ledger balance calculations
  - Complete billing and receipt history
* **Recommended Workflow:**
  $$\text{Consultation + Lab + Pharmacy + IPD Stay} \longrightarrow \text{Consolidated Invoice} \longrightarrow \text{Payment Recorded} \longrightarrow \text{Balance Settled}$$
* **Impact / Demo Value:** Replaces disconnected billing forms with seamless automated background aggregation from all hospital departments.

---

### Phase 10: Nursing Management
* **Objective:** Implement the clinical ward workflow for nurses caring for admitted and active patients.
* **Features to Implement:**
  - Dedicated Nurse Station Dashboard
  - Ward-wise assigned patient lists
  - Periodic vital signs monitoring and trend charting
  - Daily nursing care notes and shift handoff logs (SBAR format)
  - Electronic Medication Administration Record (eMAR) with scheduled dose tracking
  - Real-time patient condition updates and doctor call alerts
* **Recommended Workflow:**
  $$\text{Patient Admission} \longrightarrow \text{Nurse Assigned} \longrightarrow \text{Vitals Logged} \longrightarrow \text{Nursing Notes} \longrightarrow \text{Medication Administered (eMAR)}$$
* **Impact / Demo Value:** Connects inpatient ward operations directly to the patient's EMR and gives nursing staff an active operational cockpit.

---

### Phase 11: Emergency Management
* **Objective:** Handle acute walk-in and ambulance emergency patients with rapid triage and immediate resource allocation.
* **Features to Implement:**
  - Rapid emergency intake and unregistered patient bypass
  - Standardized triage priority scoring (Level 1 Resuscitation, Level 2 Emergent, Level 3 Urgent, Level 4 Non-urgent)
  - Instant ER doctor on-call assignment
  - Emergency bay and trauma bed allocation
  - ER rapid clinical notes and initial resuscitation logs
  - Real-time emergency patient tracking: `Triage` $\rightarrow$ `Stabilizing` $\rightarrow$ `Admitted to ICU/Ward` $\rightarrow$ `Discharged`
* **Recommended Workflow:**
  $$\text{Emergency Arrival} \longrightarrow \text{Triage Priority Level} \longrightarrow \text{Doctor Dispatched} \longrightarrow \text{Trauma Bed} \longrightarrow \text{Treatment / Transfer}$$
* **Impact / Demo Value:** Shows emergency room speed, critical care priority coding, and rapid resource dispatch.

---

### Phase 12: Insurance & TPA Claims
* **Objective:** Track patient health insurance policies, cashless pre-authorizations, and claims alongside billing.
* **Features to Implement:**
  - Patient insurance profile and policy detail capture
  - Third-Party Administrator (TPA) package mapping
  - Coverage limits, copay percentages, and deductible details
  - Insurance pre-authorization claim creation
  - Claim submission tracking and document attachment
  - Claim lifecycle status states: `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Approved` $\rightarrow$ `Rejected` $\rightarrow$ `Settled`
* **Recommended Workflow:**
  $$\text{Patient Profile} \longrightarrow \text{Insurance Verification} \longrightarrow \text{Medical Invoice} \longrightarrow \text{Claim Generated} \longrightarrow \text{Claim Settlement}$$
* **Impact / Demo Value:** Integrates complex healthcare finance and insurance coverage tracking into everyday hospital billing.

---

### Phase 13: Operational Notifications
* **Objective:** Provide a real-time event-driven notification backbone communicating critical operational alerts across all modules.
* **Features to Implement:**
  - In-app interactive notification bell and dropdown feed
  - Real-time appointment scheduling and cancellation alerts
  - Laboratory panic values and ready report alerts for doctors
  - Pharmacy low-stock and upcoming batch expiry alerts
  - Patient outstanding payment and invoice generation reminders
  - Inpatient admission, ward transfer, and discharge alerts
  - Read/unread status toggles and alert dismissal controls
* **Recommended Workflow:**
  $$\text{Operational System Event} \longrightarrow \text{Notification Engine} \longrightarrow \text{Broadcast to Targeted User/Role}$$
* **Impact / Demo Value:** Eliminates the need for manual page refreshing and makes the platform feel dynamic, reactive, and interconnected.

---

### Phase 14: Global Search & Filtering
* **Objective:** Provide fast, intelligent navigation and retrieval across the entire growing hospital database.
* **Features to Implement:**
  - Universal global search bar with instant autocomplete
  - Patient search by Name, Phone, National ID, or Unique Health ID (UHID)
  - Doctor search by Name, Specialization, and Department
  - Appointment, prescription, invoice, and lab record search
  - Multi-dimensional date range filters
  - Department and specialty filters
  - Status filters across all hospital entities
  - Multi-column sort controls (alphabetical, chronological, monetary)
  - Server-side paginated data tables with selectable page size
* **Recommended Workflow:**
  $$\text{Search Input} \longrightarrow \text{Multi-Field Filters Applied} \longrightarrow \text{Sorted Results} \longrightarrow \text{Paginated View}$$
* **Impact / Demo Value:** Proves enterprise usability and high-speed data access when navigating large volumes of hospital records.

---

### Phase 15: Reports & Analytics (BI)
* **Objective:** Transform raw operational, clinical, and financial data into actionable executive insights.
* **Features to Implement:**
  - Outpatient (OPD) volume and patient demographic reports
  - Doctor consultation productivity and appointment completion statistics
  - Revenue analytics: daily collections, department-wise earnings, and fee breakdowns
  - Aging reports on outstanding patient balances and pending insurance claims
  - Pharmacy inventory turnover, fast-moving items, and stock loss reports
  - Laboratory diagnostic volume and turnaround time (TAT) metrics
  - Bed occupancy rates, average length of stay (ALOS), and ICU utilization
  - Interactive dashboard charts (bar charts, trend lines, donut breakdowns)
* **Recommended Workflow:**
  $$\text{Operational Data Streams} \longrightarrow \text{Aggregation Engine} \longrightarrow \text{Visual KPI Dashboards} \longrightarrow \text{Exportable Report (PDF/Excel)}$$
* **Impact / Demo Value:** Provides leadership with high-level visibility into hospital revenue leaks, clinical throughput, and bed efficiency.

---

### Phase 16: Document Management
* **Objective:** Securely store, categorize, and control role-based access to clinical and administrative documents.
* **Features to Implement:**
  - Digital medical document and radiology scan uploads
  - Storage of digital lab reports and signed prescriptions
  - Patient insurance cards, government IDs, and signed consent forms
  - Strict file MIME type and maximum file size validations
  - Encrypted document storage with access-controlled file serving
  - Role-based download and deletion permission controls
* **Recommended Workflow:**
  $$\text{Patient / Operator} \longrightarrow \text{Upload Document} \longrightarrow \text{Validation & Encrypted Store} \longrightarrow \text{Authorized Role Access}$$
* **Impact / Demo Value:** Delivers a secure, paperless digital archive compliant with healthcare record management standards.

---

### Phase 17: Audit Logs
* **Objective:** Provide complete forensic traceability for every read, mutation, and sensitive action in the system.
* **Features to Implement:**
  - Capture of acting user ID, role, IP address, and browser agent
  - Action classification (CREATE, READ, UPDATE, DELETE, EXPORT)
  - Module / Entity scoping (Patient, Prescription, Billing, Lab, Pharmacy)
  - ISO precision timestamps
  - Before/after data diff tracking for record modifications
  - Dedicated Audit Log Viewer interface for Compliance Officers
  - Audit search and date/user/module filtering
* **Recommended Workflow:**
  $$\text{User Mutation Action} \longrightarrow \text{Audit Interceptor} \longrightarrow \text{Tamper-Proof Audit Table} \longrightarrow \text{Security Audit History}$$
* **Impact / Demo Value:** Essential enterprise compliance feature satisfying HIPAA, GDPR, NABH, and JCI audit requirements.

---

### Phase 18: Hospital Settings
* **Objective:** Centralize all hospital configuration settings after operational modules are functioning.
* **Features to Implement:**
  - Hospital organization profile (Legal entity name, tax registration number)
  - Hospital logo, letterhead headers, and footer branding
  - Physical address, contact numbers, and emergency hotline
  - Department and clinic unit configuration
  - Appointment scheduling rules, working days, and public holiday calendar
  - Billing settings, currency symbols, and standard tax rates
  - Default consultation fee schedule by doctor seniority
  - System role permission matrix adjustments
* **Recommended Workflow:**
  $$\text{Admin} \longrightarrow \text{Settings Panel} \longrightarrow \text{Update Configuration} \longrightarrow \text{Propagated to All Modules}$$
* **Impact / Demo Value:** Ensures the system is fully white-labelable and adaptable to diverse clinic and multi-center hospital requirements.

---

### Phase 19: Security Hardening
* **Objective:** Harden the codebase against security vulnerabilities prior to final demonstration and release.
* **Features to Implement:**
  - Protected API routes and strict JWT authentication verification
  - Granular API endpoint authorization checks (verifying role and resource ownership)
  - Strict input validation and sanitization on all backend routes (preventing SQLi, XSS, and NoSQL injection)
  - Secure credential storage (Argon2 / BCrypt with high work factor)
  - Secure file upload validation (magic byte checks, sandboxing)
  - Centralized exception and error handling without exposing stack traces to clients
  - Rate limiting on authentication and sensitive endpoints (preventing brute-force)
  - Comprehensive audit log coverage across all mutating API routes
* **Recommended Workflow:**
  $$\text{Client Request} \longrightarrow \text{Rate Limiter} \longrightarrow \text{Input Validator} \longrightarrow \text{Role Authorizer} \longrightarrow \text{Business Logic} \longrightarrow \text{Sanitized Response}$$
* **Impact / Demo Value:** Transforms a working functional prototype into a production-grade, secure healthcare platform.

---

### Phase 20: Testing, Stabilization & Final Demo
* **Objective:** Verify end-to-end multi-department workflows, eliminate edge bugs, and prepare a polished presentation experience.
* **Features to Implement:**
  - Unit tests for critical calculations (billing, medication dosage, fee aggregation)
  - API endpoint integration test suites
  - Role-based authorization test coverage
  - End-to-end (E2E) automated browser workflow tests
  - Regression testing across all 20 previous phases
  - Multi-device responsive testing (Desktop, iPad/Tablet, Mobile)
  - Bug remediation and edge case handling
  - Comprehensive seed demo dataset (realistic patients, doctor rosters, historical visits)
  - Final visual UI/UX polish, transitions, and typography alignment
  - Complete technical architecture documentation and user manual
* **Recommended Workflow:**
  $$\text{Login} \longrightarrow \text{Patient Registration} \longrightarrow \text{Appointment} \longrightarrow \text{EMR Consult} \longrightarrow \text{Prescription} \longrightarrow \text{Pharmacy Dispense} \longrightarrow \text{Consolidated Billing}$$
* **Impact / Demo Value:** Guarantees a flawless, high-impact demonstration showcasing connected hospital operations rather than isolated mock screens.

---

## 🎯 High-Impact Demo Strategy

When demonstrating MedCore HMS under time constraints, always present **connected end-to-end workflows**:

| Demo Workflow | Step-by-Step Sequence | Core Value Demonstrated |
| :--- | :--- | :--- |
| **1. Outpatient (OPD)** | Patient Registration $\rightarrow$ Appointment Scheduling $\rightarrow$ Doctor Consultation $\rightarrow$ EMR Diagnosis $\rightarrow$ Digital Prescription $\rightarrow$ Billing Settlement | Shows the core outpatient clinical journey from start to finish. |
| **2. Laboratory (LIS)** | Doctor Consultation $\rightarrow$ Diagnostic Lab Order $\rightarrow$ Phlebotomy Sample Intake $\rightarrow$ Machine Result Entry $\rightarrow$ Pathologist Verified Report $\rightarrow$ EMR Timeline Sync | Demonstrates seamless multi-role coordination between clinical and diagnostic staff. |
| **3. Inpatient (IPD)** | Emergency/OPD Intake $\rightarrow$ Bed Assignment $\rightarrow$ Nurse Station Vitals $\rightarrow$ Doctor Ward Round $\rightarrow$ Auto-Billing Aggregation $\rightarrow$ Patient Discharge | Proves inpatient capacity management, nurse care tracking, and automatic fee aggregation. |

---

## 📅 Recommended Development Order

1. **Step 1:** Build **Phase 0** and **Phase 1** before attempting any hospital workflow.
2. **Step 2:** Complete **Phase 2**, making the **Patient Profile** the central data hub.
3. **Step 3:** Build **Phases 3 $\rightarrow$ 4 $\rightarrow$ 5** together as a single unified Outpatient (OPD) workflow.
4. **Step 4:** Add **Phase 6** (Pharmacy) and **Phase 7** (Laboratory) to connect clinical orders to ancillary departments.
5. **Step 5:** Add **Phase 8** (Beds) and **Phase 9** (Billing) for inpatient stay and automated revenue aggregation.
6. **Step 6:** Add **Phases 10 $\rightarrow$ 13** for Nursing stations, Emergency triage, Insurance claims, and Real-time Notifications.
7. **Step 7:** Add **Phases 14 $\rightarrow$ 18** for Global Search, Analytics, Document Archives, Audit Trails, and Hospital Settings once sufficient realistic data exists.
8. **Step 8:** Complete **Phase 19** (Security Hardening) and **Phase 20** (Testing & Polish) before the final production presentation.

> **Final Goal:** MedCore HMS must function as one connected biological system. Every patient action (consultation, test, medicine, bed night) automatically creates and synchronizes related records, inventory counts, audit trails, and financial statements across all relevant hospital departments.
