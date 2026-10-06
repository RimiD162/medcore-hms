require('dotenv').config();
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Starting MedCore HMS Seed Data Generation (Full Multi-Role Ecosystem: Doctor + Nurse + Receptionist + Pharmacist)...');

  // 1. Fast truncate of all tables with retry
  console.log('Cleaning existing database tables...');
  let truncateSuccess = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE 
          dispensing_items,
          dispensings,
          stock_receipt_items,
          stock_receipts,
          stock_transactions,
          medicine_batches,
          medicines,
          pharmacist_profiles,
          emergency_registrations,
          payments,
          invoice_items,
          invoices,
          service_catalog,
          receptionist_profiles,
          medication_administrations,
          nursing_notes,
          vital_signs,
          nurse_assignments,
          beds,
          admissions,
          nurse_profiles,
          prescription_items,
          documents,
          lab_reports,
          prescriptions,
          medical_records,
          consultations,
          appointments,
          follow_ups,
          doctor_availabilities,
          doctor_profiles,
          notifications,
          audit_logs,
          patients,
          users,
          hospitals
        CASCADE;
      `);
      truncateSuccess = true;
      break;
    } catch (err) {
      console.warn(`Truncate attempt ${attempt}/3 failed: ${err.message}. Retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!truncateSuccess) throw new Error('Failed to truncate tables after 3 attempts');
  console.log('✅ Clean complete.');

  // 2. Hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'MedCore Central Hospital & Research Center',
      address: '742 Healthcare Boulevard, Metro Health City',
      city: 'Metro City',
      country: 'India',
      phone: '+91 98765 43210',
      email: 'contact@medcore.health',
      taxNumber: 'GSTIN29AAACM1234A1Z5',
      isActive: true,
    },
  });

  const doctorPasswordHash = await bcrypt.hash('Doctor@123', 10);
  const nursePasswordHash = await bcrypt.hash('Nurse@123', 10);
  const receptionistPasswordHash = await bcrypt.hash('Receptionist@123', 10);
  const pharmacistPasswordHash = await bcrypt.hash('Pharmacist@123', 10);

  // 3. Receptionist User & Profile
  const receptionistUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'RECEPTIONIST',
      fullName: 'Emily Watson',
      email: 'receptionist@medcore.health',
      passwordHash: receptionistPasswordHash,
      phone: '+91 98999 11223',
      employeeId: 'EMP-REC-301',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      isActive: true,
      isVerified: true,
    },
  });

  const receptionistProfile = await prisma.receptionistProfile.create({
    data: {
      userId: receptionistUser.id,
      department: 'Main Lobby & Front Desk Operations',
      shift: 'Morning (08:00 - 16:00)',
      status: 'On Duty',
      employeeId: 'EMP-REC-301',
      phone: '+91 98999 11223',
      bio: 'Senior Patient Care Coordinator & Front Desk Supervisor with 6+ years in healthcare queue management and patient intake.',
    },
  });

  // 3b. Pharmacist User & Profile
  const pharmacistUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'PHARMACIST',
      fullName: 'Marcus Sterling, RPh',
      email: 'pharmacist@medcore.health',
      passwordHash: pharmacistPasswordHash,
      phone: '+91 98111 55667',
      employeeId: 'EMP-PHARM-401',
      avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
      isActive: true,
      isVerified: true,
    },
  });

  const pharmacistProfile = await prisma.pharmacistProfile.create({
    data: {
      userId: pharmacistUser.id,
      department: 'Central Pharmacy & Dispensary',
      licenseNumber: 'RPH-2021-99881',
      shift: 'Day (08:00 - 16:00)',
      status: 'On Duty',
      employeeId: 'EMP-PHARM-401',
      phone: '+91 98111 55667',
      bio: 'Chief Clinical Pharmacist with 8+ years specializing in hospital dispensary, batch inventory management, and prescription verification.',
    },
  });

  // 4. Doctors across 3 Departments
  // Doctor 1: Dr. Sarah Chen (Cardiology)
  const doctorUser1 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. Sarah Chen',
      email: 'dr.chen@medcore.health',
      passwordHash: doctorPasswordHash,
      phone: '+91 98111 22334',
      employeeId: 'EMP-DOC-101',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const doctorProfile1 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser1.id,
      department: 'Cardiology & Cardiovascular Health',
      specialization: 'Consultant Interventional Cardiologist',
      licenseNumber: 'MCI-REG-88392-CARD',
      consultationFee: 750.00,
      experienceYears: 12,
      qualifications: ['MBBS (AIIMS)', 'MD (Internal Medicine)', 'DM (Cardiology)'],
      bio: 'Board-certified cardiologist specializing in preventive cardiology, hypertension management, echocardiography, and coronary interventions.',
      roomNumber: 'OPD-102 (Wing B)',
      status: 'Available',
    },
  });

  // Doctor 2: Dr. Marcus Vance (General Medicine)
  const doctorUser2 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. Marcus Vance',
      email: 'dr.vance@medcore.health',
      passwordHash: doctorPasswordHash,
      phone: '+91 98222 33445',
      employeeId: 'EMP-DOC-102',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const doctorProfile2 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser2.id,
      department: 'General & Internal Medicine',
      specialization: 'Senior Consultant Physician',
      licenseNumber: 'MCI-REG-55210-MED',
      consultationFee: 500.00,
      experienceYears: 15,
      qualifications: ['MBBS', 'MD (General Medicine)', 'FRCP'],
      bio: 'Expert in chronic disease management, diabetes care, respiratory infections, and comprehensive geriatric diagnostics.',
      roomNumber: 'OPD-105 (Wing A)',
      status: 'Available',
    },
  });

  // Doctor 3: Dr. Priya Sharma (Pediatrics)
  const doctorUser3 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. Priya Sharma',
      email: 'dr.sharma@medcore.health',
      passwordHash: doctorPasswordHash,
      phone: '+91 98333 11224',
      employeeId: 'EMP-DOC-103',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813571-638f026361a6?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const doctorProfile3 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser3.id,
      department: 'Pediatrics & Child Health',
      specialization: 'Consultant Pediatrician & Neonatologist',
      licenseNumber: 'MCI-REG-77412-PED',
      consultationFee: 600.00,
      experienceYears: 9,
      qualifications: ['MBBS', 'MD (Pediatrics)', 'DCH'],
      bio: 'Dedicated pediatrician specializing in childhood growth monitoring, developmental pediatrics, and pediatric vaccinations.',
      roomNumber: 'OPD-108 (Wing C)',
      status: 'Available',
    },
  });

  // Doctor 4: Dr. Alex Rivera (Orthopedics)
  const doctorUser4 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. Alex Rivera',
      email: 'dr.rivera@medcore.health',
      passwordHash: doctorPasswordHash,
      phone: '+91 98444 22335',
      employeeId: 'EMP-DOC-104',
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const doctorProfile4 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser4.id,
      department: 'Orthopedics & Joint Surgery',
      specialization: 'Consultant Orthopedic Surgeon',
      licenseNumber: 'MCI-REG-99120-ORTH',
      consultationFee: 700.00,
      experienceYears: 14,
      qualifications: ['MBBS', 'MS (Orthopedics)', 'MCh (Joint Replacement)'],
      bio: 'Specialist in joint replacement, sports injury management, arthroscopic surgery, and fracture rehabilitation.',
      roomNumber: 'OPD-112 (Wing A)',
      status: 'Available',
    },
  });

  // Doctor 5: Dr. James Wilson (Emergency Medicine)
  const doctorUser5 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. James Wilson',
      email: 'dr.wilson@medcore.health',
      passwordHash: doctorPasswordHash,
      phone: '+91 98555 33446',
      employeeId: 'EMP-DOC-105',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const doctorProfile5 = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser5.id,
      department: 'Emergency & Critical Care',
      specialization: 'Attending Trauma & Emergency Physician',
      licenseNumber: 'MCI-REG-33451-EMG',
      consultationFee: 800.00,
      experienceYears: 11,
      qualifications: ['MBBS', 'MD (Emergency Medicine)', 'FACEM'],
      bio: 'Head of Emergency Intake specializing in acute resuscitation, polytrauma stabilization, and rapid clinical triage.',
      roomNumber: 'ER Triage Bay 1',
      status: 'Available',
    },
  });

  // Doctor Weekly Availabilities (Mon to Fri for all doctors)
  const scheduleDays = [1, 2, 3, 4, 5];
  const allDoctorProfiles = [doctorProfile1, doctorProfile2, doctorProfile3, doctorProfile4, doctorProfile5];

  for (const doc of allDoctorProfiles) {
    for (const day of scheduleDays) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '13:00',
          breakEndTime: '14:00',
          consultationDuration: 15,
          isActive: true,
        },
      });
    }
  }

  // 5. Nurses
  const nurseUser1 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'NURSE',
      fullName: 'Nurse Sarah Jenkins',
      email: 'nurse.jenkins@medcore.health',
      passwordHash: nursePasswordHash,
      phone: '+91 98333 44556',
      employeeId: 'EMP-NUR-201',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813571-638f026361a6?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const nurseProfile1 = await prisma.nurseProfile.create({
    data: {
      userId: nurseUser1.id,
      department: 'Inpatient Wards & Triage',
      ward: 'Ward 3B - General & Post-Op Recovery',
      shift: 'Day (08:00 - 16:00)',
      status: 'On Duty',
      licenseNumber: 'NC-REG-94812-RN',
      qualifications: ['B.Sc. Nursing', 'Critical Care Nursing Certified (CCCN)', 'BLS/ACLS Certified'],
      bio: 'Senior Ward Charge Nurse with 8+ years experience in postoperative patient monitoring, medication administration, and acute triage management.',
      phone: '+91 98333 44556',
    },
  });

  const nurseUser2 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'NURSE',
      fullName: 'Nurse David Kim',
      email: 'nurse.kim@medcore.health',
      passwordHash: nursePasswordHash,
      phone: '+91 98444 55667',
      employeeId: 'EMP-NUR-202',
      avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
      isActive: true,
      isVerified: true,
    },
  });

  const nurseProfile2 = await prisma.nurseProfile.create({
    data: {
      userId: nurseUser2.id,
      department: 'Inpatient Wards & Triage',
      ward: 'Ward 2A - Stepdown ICU & Cardiac Care',
      shift: 'Day (08:00 - 16:00)',
      status: 'On Duty',
      licenseNumber: 'NC-REG-87219-RN',
      qualifications: ['B.Sc. Nursing', 'Emergency & Trauma Care Specialist', 'ACLS Provider'],
      bio: 'Staff Nurse specializing in cardiovascular monitoring, telemetry vitals assessment, and intensive medication delivery.',
      phone: '+91 98444 55667',
    },
  });

  // 6. Service Catalog (Hospital Billing Master)
  const serviceCatalogData = [
    { code: 'SRV-CONS-GEN', name: 'General Physician OPD Consultation', category: 'Consultation', price: 500.00, description: 'Standard outpatient general health checkup and primary assessment' },
    { code: 'SRV-CONS-SPEC', name: 'Specialist / Cardiologist Consultation', category: 'Consultation', price: 750.00, description: 'Comprehensive diagnostic consult by board-certified specialist' },
    { code: 'SRV-CONS-PED', name: 'Pediatric Well-Child Consultation', category: 'Consultation', price: 600.00, description: 'Growth tracking, developmental evaluation, and pediatric examination' },
    { code: 'SRV-LAB-CBC', name: 'Complete Blood Count with Differential (CBC)', category: 'Diagnostic', price: 250.00, description: 'Automated 5-part differential hematology assay' },
    { code: 'SRV-LAB-LIPID', name: 'Lipid Profile Comprehensive Panel', category: 'Diagnostic', price: 450.00, description: 'Total cholesterol, HDL, LDL, VLDL, and triglycerides' },
    { code: 'SRV-RAD-XRAY', name: 'Digital Chest X-Ray (PA View)', category: 'Diagnostic', price: 400.00, description: 'High-resolution digital thoracic radiograph' },
    { code: 'SRV-RAD-ECG', name: '12-Lead Rest Electrocardiogram (ECG)', category: 'Diagnostic', price: 300.00, description: 'Standard 12-lead cardiovascular tracing with automated interpretation' },
    { code: 'SRV-EMG-TRIAGE', name: 'Emergency Trauma & Triage Intake Fee', category: 'Emergency', price: 600.00, description: 'Immediate emergency bed stabilization, nursing triage, and doctor intake' },
    { code: 'SRV-WARD-DAY', name: 'Day Care Observation Bed Charge', category: 'Ward & Bed', price: 1000.00, description: '6-hour monitored observation bay with nursing oversight' },
  ];

  const createdServices = [];
  for (const s of serviceCatalogData) {
    const srv = await prisma.serviceCatalog.create({ data: s });
    createdServices.push(srv);
  }

  // 7. 10 Realistic Patients
  const patientsData = [
    {
      patientIdNumber: 'MC-2026-000101',
      fullName: 'Robert Sterling',
      dateOfBirth: new Date('1968-05-14'),
      age: 58,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+91 98450 11223',
      email: 'robert.sterling@example.com',
      address: '42 Maple Street, Green Avenue, Metro City',
      emergencyContact: 'Mary Sterling (Wife)',
      emergencyPhone: '+91 98450 11224',
      allergies: ['Penicillin', 'Ciprofloxacin'],
      chronicConditions: ['Essential Hypertension (Grade 2)', 'Hyperlipidemia'],
      status: 'Inpatient',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000102',
      fullName: 'Elena Rostova',
      dateOfBirth: new Date('1992-09-22'),
      age: 34,
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '+91 97320 44556',
      email: 'elena.rostova@example.com',
      address: '15 Crescent Lake Towers, Block C, Metro City',
      emergencyContact: 'Dmitri Rostova (Brother)',
      emergencyPhone: '+91 97320 44557',
      allergies: ['Sulfa Drugs'],
      chronicConditions: ['Post-Op Appendectomy Recovery'],
      status: 'Inpatient',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000103',
      fullName: 'Clara Oswald',
      dateOfBirth: new Date('1981-11-03'),
      age: 45,
      gender: 'Female',
      bloodGroup: 'B+',
      phone: '+91 96550 77889',
      email: 'clara.oswald@example.com',
      address: '88 Rosewood Residency, Metro City',
      emergencyContact: 'Danny Oswald (Spouse)',
      emergencyPhone: '+91 96550 77880',
      allergies: ['Aspirin', 'NSAIDs'],
      chronicConditions: ['Bronchial Asthma (Moderate)', 'Allergic Rhinitis'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000104',
      fullName: 'David Miller',
      dateOfBirth: new Date('1959-03-18'),
      age: 67,
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '+91 95410 88990',
      email: 'david.miller@example.com',
      address: '104 Palm Grove Estates, Metro City',
      emergencyContact: 'Arthur Miller (Son)',
      emergencyPhone: '+91 95410 88991',
      allergies: [],
      chronicConditions: ['Type II Diabetes Mellitus', 'Coronary Artery Disease (Post-Stent)'],
      status: 'Inpatient',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000105',
      fullName: 'Maya Patel',
      dateOfBirth: new Date('1995-07-30'),
      age: 31,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '+91 94220 33445',
      email: 'maya.patel@example.com',
      address: '22 Lotus Valley Apartments, Metro City',
      emergencyContact: 'Kunal Patel (Husband)',
      emergencyPhone: '+91 94220 33446',
      allergies: ['Dust Mites', 'Latex'],
      chronicConditions: ['Hypothyroidism'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000106',
      fullName: 'Thomas Wright',
      dateOfBirth: new Date('1987-02-11'),
      age: 39,
      gender: 'Male',
      bloodGroup: 'A+',
      phone: '+91 93110 55667',
      email: 'thomas.wright@example.com',
      address: '74 Oak Ridge Boulevard, Metro City',
      emergencyContact: 'Hannah Wright (Sister)',
      emergencyPhone: '+91 93110 55668',
      allergies: [],
      chronicConditions: ['Lumbar Disc Herniation'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000107',
      fullName: 'Sophia Martinez',
      dateOfBirth: new Date('2002-11-19'),
      age: 24,
      gender: 'Female',
      bloodGroup: 'B-',
      phone: '+91 92000 66778',
      email: 'sophia.martinez@example.com',
      address: '109 Sunview Heights, Metro City',
      emergencyContact: 'Carlos Martinez (Father)',
      emergencyPhone: '+91 92000 66779',
      allergies: ['Peanuts'],
      chronicConditions: ['Migraine with Aura'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000108',
      fullName: 'Liam O\'Connor',
      dateOfBirth: new Date('1975-08-25'),
      age: 51,
      gender: 'Male',
      bloodGroup: 'O-',
      phone: '+91 91888 77889',
      email: 'liam.oconnor@example.com',
      address: '56 Hillcrest Avenue, Metro City',
      emergencyContact: 'Fiona O\'Connor (Wife)',
      emergencyPhone: '+91 91888 77890',
      allergies: ['Codeine'],
      chronicConditions: ['Gastroesophageal Reflux Disease (GERD)'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000109',
      fullName: 'Grace Kim',
      dateOfBirth: new Date('1964-04-02'),
      age: 62,
      gender: 'Female',
      bloodGroup: 'AB-',
      phone: '+91 90777 88990',
      email: 'grace.kim@example.com',
      address: '33 Willowbrook Lane, Metro City',
      emergencyContact: 'Daniel Kim (Son)',
      emergencyPhone: '+91 90777 88991',
      allergies: [],
      chronicConditions: ['Osteoarthritis (Bilateral Knees)'],
      status: 'Active',
      registrationSource: 'Standard',
    },
    {
      patientIdNumber: 'MC-2026-000110',
      fullName: 'Arthur Pendelton',
      dateOfBirth: new Date('1954-12-08'),
      age: 72,
      gender: 'Male',
      bloodGroup: 'A-',
      phone: '+91 89666 99001',
      email: 'arthur.pendelton@example.com',
      address: '12 Heritage Gardens, Metro City',
      emergencyContact: 'Margaret Pendelton (Wife)',
      emergencyPhone: '+91 89666 99002',
      allergies: ['Morphine'],
      chronicConditions: ['Chronic Kidney Disease (Stage 3)', 'Atrial Fibrillation'],
      status: 'Active',
      registrationSource: 'Emergency',
    },
  ];

  const createdPatients = [];
  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        hospitalId: hospital.id,
        ...p,
      },
    });
    createdPatients.push(patient);
  }

  // 8. Nurse Assignments
  await prisma.nurseAssignment.create({
    data: {
      nurseId: nurseProfile1.id,
      patientId: createdPatients[0].id,
      ward: 'Ward 3B - Room 304',
      shift: 'Day',
      isActive: true,
      notes: 'Primary nurse for cardiac inpatient monitoring.',
    },
  });

  await prisma.nurseAssignment.create({
    data: {
      nurseId: nurseProfile1.id,
      patientId: createdPatients[1].id,
      ward: 'Ward 3B - Room 308',
      shift: 'Day',
      isActive: true,
      notes: 'Post-op appendectomy wound care & ambulation assistance.',
    },
  });

  await prisma.nurseAssignment.create({
    data: {
      nurseId: nurseProfile2.id,
      patientId: createdPatients[3].id,
      ward: 'Ward 2A - Room 201',
      shift: 'Day',
      isActive: true,
      notes: 'Diabetic foot dressing & continuous telemetry oversight.',
    },
  });

  // 9. Beds & Wards
  const bedsData = [
    { ward: 'Ward 3B', roomNumber: '304', bedNumber: 'Bed 1', status: 'OCCUPIED', patientId: createdPatients[0].id },
    { ward: 'Ward 3B', roomNumber: '304', bedNumber: 'Bed 2', status: 'AVAILABLE', patientId: null },
    { ward: 'Ward 3B', roomNumber: '308', bedNumber: 'Bed 1', status: 'AVAILABLE', patientId: null },
    { ward: 'Ward 3B', roomNumber: '308', bedNumber: 'Bed 2', status: 'OCCUPIED', patientId: createdPatients[1].id },
    { ward: 'Ward 2A (ICU)', roomNumber: '201', bedNumber: 'Bed 1', status: 'OCCUPIED', patientId: createdPatients[3].id },
    { ward: 'Ward 2A (ICU)', roomNumber: '201', bedNumber: 'Bed 2', status: 'RESERVED', patientId: null },
    { ward: 'Ward 2A (ICU)', roomNumber: '202', bedNumber: 'Bed 1', status: 'MAINTENANCE', patientId: null },
    { ward: 'OPD Triage', roomNumber: 'Bay 1', bedNumber: 'Bed T-1', status: 'AVAILABLE', patientId: null },
  ];

  for (const b of bedsData) {
    await prisma.bed.create({ data: b });
  }

  // 10. Inpatient Admissions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const inTwoDays = new Date(today);
  inTwoDays.setDate(inTwoDays.getDate() + 2);

  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-001',
      patientId: createdPatients[0].id,
      admittedDate: today,
      ward: 'Ward 3B - General & Post-Op Recovery',
      roomNumber: 'Room 304',
      bedNumber: 'Bed 1',
      status: 'ADMITTED',
      attendingDoctor: 'Dr. Sarah Chen',
      admittingDiagnosis: 'Hypertensive Crisis Evaluation with Stage 2 Elevation',
      notes: 'Bed rest advised with continuous BP charting every 4 hours.',
    },
  });

  await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-002',
      patientId: createdPatients[1].id,
      admittedDate: twoDaysAgo,
      ward: 'Ward 3B - General & Post-Op Recovery',
      roomNumber: 'Room 308',
      bedNumber: 'Bed 2',
      status: 'ADMITTED',
      attendingDoctor: 'Dr. Sarah Chen',
      admittingDiagnosis: 'Acute Appendicitis - Status Post Laparoscopic Appendectomy',
      notes: 'Wound clean and dry. Advised oral fluids and light diet.',
    },
  });

  await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-2026-003',
      patientId: createdPatients[3].id,
      admittedDate: yesterday,
      ward: 'Ward 2A - Stepdown ICU & Cardiac Care',
      roomNumber: 'Room 201',
      bedNumber: 'Bed 1',
      status: 'ADMITTED',
      attendingDoctor: 'Dr. Sarah Chen',
      admittingDiagnosis: 'Diabetic Foot Ulcer & Post-PCI Stent Observation',
      notes: 'Blood sugar charting pre-meals and strict aseptic foot dressings.',
    },
  });

  // 11. 16 Realistic Appointments (Across Today, Upcoming, and Past)
  const appointmentsToCreate = [
    // Today's Appointments
    {
      appointmentNumber: 'APT-2026-101',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      appointmentDate: today,
      appointmentTime: '09:30',
      type: 'Follow-up',
      status: 'CONFIRMED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 35 * 60 * 1000), // Waiting in Lobby
      reason: 'Routine BP monitoring and chest tightness follow-up',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-102',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      appointmentDate: today,
      appointmentTime: '10:15',
      type: 'General',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Post-op 2-week checkup and wound healing review',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-103',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      appointmentDate: today,
      appointmentTime: '11:00',
      type: 'Routine',
      status: 'COMPLETED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 110 * 60 * 1000),
      reason: 'Asthma seasonal flare-up and inhaler dosage adjustment',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-104',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[5].id,
      appointmentDate: today,
      appointmentTime: '11:30',
      type: 'General',
      status: 'CONFIRMED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 15 * 60 * 1000), // Waiting in Lobby
      reason: 'Chronic lower back pain evaluation & ergonomic consult',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-105',
      doctorId: doctorProfile3.id,
      patientId: createdPatients[6].id,
      appointmentDate: today,
      appointmentTime: '14:00',
      type: 'Routine',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Young adult migraine trigger review & preventive management',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-106',
      doctorId: doctorProfile4.id,
      patientId: createdPatients[8].id,
      appointmentDate: today,
      appointmentTime: '14:30',
      type: 'Follow-up',
      status: 'CONFIRMED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 10 * 60 * 1000), // Waiting in Lobby
      reason: 'Bilateral knee osteoarthritis progression check',
      bookedById: receptionistUser.id,
    },

    // Upcoming Appointments
    {
      appointmentNumber: 'APT-2026-107',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[3].id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      type: 'Follow-up',
      status: 'CONFIRMED',
      isCheckedIn: false,
      reason: 'Quarterly HbA1c review and lipid profile monitoring',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-108',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[7].id,
      appointmentDate: tomorrow,
      appointmentTime: '11:00',
      type: 'General',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Severe acid reflux and epigastric discomfort review',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-109',
      doctorId: doctorProfile3.id,
      patientId: createdPatients[4].id,
      appointmentDate: inTwoDays,
      appointmentTime: '09:30',
      type: 'Routine',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Thyroid panel review and fatigue evaluation',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-110',
      doctorId: doctorProfile4.id,
      patientId: createdPatients[5].id,
      appointmentDate: inThreeDays,
      appointmentTime: '10:30',
      type: 'Follow-up',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Spine MRI follow-up & physical therapy prescription',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-111',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      appointmentDate: inFiveDays,
      appointmentTime: '14:00',
      type: 'Follow-up',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Post-medication 2-week cardiovascular check',
      bookedById: receptionistUser.id,
    },

    // Past Appointments
    {
      appointmentNumber: 'APT-2026-095',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      appointmentDate: yesterday,
      appointmentTime: '11:00',
      type: 'General',
      status: 'COMPLETED',
      isCheckedIn: true,
      reason: 'Acute pharyngitis and seasonal viral fever',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-096',
      doctorId: doctorProfile4.id,
      patientId: createdPatients[8].id,
      appointmentDate: yesterday,
      appointmentTime: '15:00',
      type: 'General',
      status: 'COMPLETED',
      isCheckedIn: true,
      reason: 'Knee joint mobility assessment',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-088',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      appointmentDate: lastWeek,
      appointmentTime: '15:30',
      type: 'General',
      status: 'CANCELLED',
      cancelReason: 'Patient requested reschedule due to unavoidable family travel',
      cancelledAt: lastWeek,
      cancelledById: receptionistUser.id,
      reason: 'Abdominal ultrasound review',
      bookedById: receptionistUser.id,
    },
    {
      appointmentNumber: 'APT-2026-089',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[6].id,
      appointmentDate: lastWeek,
      appointmentTime: '16:00',
      type: 'Routine',
      status: 'NO_SHOW',
      reason: 'Routine health screening consult',
      bookedById: receptionistUser.id,
    },
  ];

  const createdAppointments = [];
  for (const apt of appointmentsToCreate) {
    const createdApt = await prisma.appointment.create({ data: apt });
    createdAppointments.push(createdApt);
  }

  // 12. Consultations & Prescriptions for Doctor Workflow
  const cons1 = await prisma.consultation.create({
    data: {
      appointmentId: createdAppointments[0].id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      status: 'DRAFT',
      chiefComplaint: 'Occasional morning dizziness and mild exertion tightness',
      symptoms: ['Mild Chest Heaviness', 'Dizziness', 'Morning Fatigue'],
      vitals: { bp: '142/92', heartRate: 78, temp: 98.4, spo2: 98, weight: 84, height: 178, bmi: 26.5 },
      clinicalNotes: 'Patient notes occasional missed doses of Telmisartan on weekends.',
      diagnosis: 'Essential Hypertension (Suboptimally controlled)',
      treatmentPlan: 'Increase Telmisartan to 80mg OD morning.',
      doctorNotes: 'Monitor home BP twice daily.',
    },
  });

  const cons2 = await prisma.consultation.create({
    data: {
      appointmentId: createdAppointments[2].id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      status: 'COMPLETED',
      chiefComplaint: 'Nocturnal wheezing and breathlessness triggered by cold air',
      symptoms: ['Nocturnal Cough', 'Wheezing', 'Shortness of Breath'],
      vitals: { bp: '122/78', heartRate: 82, temp: 98.6, spo2: 97, weight: 62, height: 165, bmi: 22.8 },
      clinicalNotes: 'Bilateral expiratory wheezing noted in mid and lower zones.',
      diagnosis: 'Moderate Persistent Asthma with seasonal allergic exacerbation',
      treatmentPlan: 'Initiate Budesonide + Formoterol inhaler 200/6 mcg 2 puffs BD.',
      doctorNotes: 'Instructed on correct spacer technique.',
      completedAt: new Date(),
    },
  });

  // Prescriptions with Items
  const rx1 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-101',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      consultationId: cons1.id,
      status: 'Active',
      notes: 'Take medicines regularly after breakfast.',
      prescribedDate: today,
      items: {
        create: [
          {
            medicineName: 'Telmisartan 80mg Tablet',
            dosage: '80mg',
            frequency: '1-0-0 (Once Daily Morning)',
            duration: '30 Days',
            route: 'Oral',
            instructions: 'Take after breakfast with a full glass of water',
          },
          {
            medicineName: 'Amlodipine 5mg Tablet',
            dosage: '5mg',
            frequency: '0-0-1 (Once Daily Night)',
            duration: '30 Days',
            route: 'Oral',
            instructions: 'Take before bedtime',
          },
        ],
      },
    },
    include: { items: true },
  });

  // 13. Invoices (Shared Billing System)
  // Invoice 1: Robert Sterling (Cardiology Consult + ECG) - PAID ($1050)
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      patientId: createdPatients[0].id,
      appointmentId: createdAppointments[0].id,
      createdById: receptionistUser.id,
      issueDate: today,
      subtotal: 1050.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 1050.00,
      paidAmount: 1050.00,
      outstandingAmount: 0.00,
      status: 'PAID',
      notes: 'Consultation and 12-lead ECG fee cleared at front desk.',
      items: {
        create: [
          {
            serviceCatalogId: createdServices[1].id,
            serviceName: createdServices[1].name,
            category: createdServices[1].category,
            unitPrice: 750.00,
            quantity: 1,
            totalPrice: 750.00,
          },
          {
            serviceCatalogId: createdServices[6].id,
            serviceName: createdServices[6].name,
            category: createdServices[6].category,
            unitPrice: 300.00,
            quantity: 1,
            totalPrice: 300.00,
          },
        ],
      },
    },
  });

  // Invoice 2: Thomas Wright (General Consult + Digital X-Ray) - PARTIALLY PAID ($900 total, $500 paid, $400 due)
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      patientId: createdPatients[5].id,
      appointmentId: createdAppointments[3].id,
      createdById: receptionistUser.id,
      issueDate: today,
      subtotal: 900.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 900.00,
      paidAmount: 500.00,
      outstandingAmount: 400.00,
      status: 'PARTIALLY_PAID',
      notes: 'Initial deposit paid by Cash. Balance of $400 pending upon X-Ray radiologist report release.',
      items: {
        create: [
          {
            serviceCatalogId: createdServices[0].id,
            serviceName: createdServices[0].name,
            category: createdServices[0].category,
            unitPrice: 500.00,
            quantity: 1,
            totalPrice: 500.00,
          },
          {
            serviceCatalogId: createdServices[5].id,
            serviceName: createdServices[5].name,
            category: createdServices[5].category,
            unitPrice: 400.00,
            quantity: 1,
            totalPrice: 400.00,
          },
        ],
      },
    },
  });

  // Invoice 3: Grace Kim (Orthopedic Consult + Day Care Bed) - PENDING ($1700 due)
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      patientId: createdPatients[8].id,
      appointmentId: createdAppointments[5].id,
      createdById: receptionistUser.id,
      issueDate: today,
      subtotal: 1700.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 1700.00,
      paidAmount: 0.00,
      outstandingAmount: 1700.00,
      status: 'PENDING',
      notes: 'Awaiting insurance pre-authorization confirmation.',
      items: {
        create: [
          {
            serviceCatalogId: createdServices[1].id,
            serviceName: 'Orthopedic Joint Specialist Consultation',
            category: 'Consultation',
            unitPrice: 700.00,
            quantity: 1,
            totalPrice: 700.00,
          },
          {
            serviceCatalogId: createdServices[8].id,
            serviceName: createdServices[8].name,
            category: createdServices[8].category,
            unitPrice: 1000.00,
            quantity: 1,
            totalPrice: 1000.00,
          },
        ],
      },
    },
  });

  // Invoice 4: Clara Oswald (Asthma Therapy & Complete Blood Count) - PAID ($750)
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0004',
      patientId: createdPatients[2].id,
      appointmentId: createdAppointments[2].id,
      createdById: receptionistUser.id,
      issueDate: yesterday,
      subtotal: 750.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 750.00,
      paidAmount: 750.00,
      outstandingAmount: 0.00,
      status: 'PAID',
      notes: 'Settled in full via Card.',
      items: {
        create: [
          {
            serviceCatalogId: createdServices[0].id,
            serviceName: createdServices[0].name,
            category: createdServices[0].category,
            unitPrice: 500.00,
            quantity: 1,
            totalPrice: 500.00,
          },
          {
            serviceCatalogId: createdServices[3].id,
            serviceName: createdServices[3].name,
            category: createdServices[3].category,
            unitPrice: 250.00,
            quantity: 1,
            totalPrice: 250.00,
          },
        ],
      },
    },
  });

  // Invoice 5: Arthur Pendelton (Emergency Triage & Trauma Intake) - PAID ($600)
  const inv5 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0005',
      patientId: createdPatients[9].id,
      createdById: receptionistUser.id,
      issueDate: yesterday,
      subtotal: 600.00,
      taxAmount: 0.00,
      discountAmount: 0.00,
      totalAmount: 600.00,
      paidAmount: 600.00,
      outstandingAmount: 0.00,
      status: 'PAID',
      notes: 'Emergency admission intake charge paid via UPI by family.',
      items: {
        create: [
          {
            serviceCatalogId: createdServices[7].id,
            serviceName: createdServices[7].name,
            category: createdServices[7].category,
            unitPrice: 600.00,
            quantity: 1,
            totalPrice: 600.00,
          },
        ],
      },
    },
  });

  // 14. 8 Realistic Payments
  const paymentsData = [
    {
      paymentNumber: 'PAY-2026-0001',
      invoiceId: inv1.id,
      patientId: createdPatients[0].id,
      amount: 1050.00,
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-984210984',
      paidAt: new Date(Date.now() - 30 * 60 * 1000), // Today
      receivedById: receptionistUser.id,
      notes: 'Cleared via PhonePe UPI at desk 2.',
    },
    {
      paymentNumber: 'PAY-2026-0002',
      invoiceId: inv2.id,
      patientId: createdPatients[5].id,
      amount: 500.00,
      paymentMethod: 'CASH',
      referenceNumber: 'CASH-REC-0042',
      paidAt: new Date(Date.now() - 12 * 60 * 1000), // Today
      receivedById: receptionistUser.id,
      notes: 'Cash received and deposited in front desk drawer.',
    },
    {
      paymentNumber: 'PAY-2026-0003',
      invoiceId: inv4.id,
      patientId: createdPatients[2].id,
      amount: 750.00,
      paymentMethod: 'CARD',
      referenceNumber: 'POS-AUTH-882194',
      paidAt: yesterday,
      receivedById: receptionistUser.id,
      notes: 'Chip & PIN POS Card Transaction (Visa ending 4129).',
    },
    {
      paymentNumber: 'PAY-2026-0004',
      invoiceId: inv5.id,
      patientId: createdPatients[9].id,
      amount: 600.00,
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-552190871',
      paidAt: yesterday,
      receivedById: receptionistUser.id,
      notes: 'GPay QR Scan transaction.',
    },
    {
      paymentNumber: 'PAY-2026-0005',
      invoiceId: inv1.id,
      patientId: createdPatients[0].id,
      amount: 250.00,
      paymentMethod: 'CASH',
      referenceNumber: 'CASH-REC-0038',
      paidAt: lastWeek,
      receivedById: receptionistUser.id,
      notes: 'Follow-up consultation advance deposit.',
    },
    {
      paymentNumber: 'PAY-2026-0006',
      invoiceId: inv4.id,
      patientId: createdPatients[2].id,
      amount: 400.00,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-REF-20260928-881',
      paidAt: lastWeek,
      receivedById: receptionistUser.id,
      notes: 'Online corporate health package bank wire.',
    },
    {
      paymentNumber: 'PAY-2026-0007',
      invoiceId: inv2.id,
      patientId: createdPatients[5].id,
      amount: 200.00,
      paymentMethod: 'CARD',
      referenceNumber: 'POS-AUTH-110943',
      paidAt: lastWeek,
      receivedById: receptionistUser.id,
      notes: 'Mastercard POS terminal swipe.',
    },
    {
      paymentNumber: 'PAY-2026-0008',
      invoiceId: inv5.id,
      patientId: createdPatients[9].id,
      amount: 500.00,
      paymentMethod: 'CASH',
      referenceNumber: 'CASH-REC-0021',
      paidAt: lastWeek,
      receivedById: receptionistUser.id,
      notes: 'Emergency stabilization triage initial receipt.',
    },
  ];

  for (const pay of paymentsData) {
    await prisma.payment.create({ data: pay });
  }

  // 15. 3 Emergency Registrations
  await prisma.emergencyRegistration.create({
    data: {
      emergencyNumber: 'EMG-2026-001',
      patientId: createdPatients[9].id, // Arthur Pendelton
      arrivedAt: new Date(Date.now() - 45 * 60 * 1000), // Today
      priority: 'CRITICAL',
      reason: 'Acute respiratory distress with chest pain, SpO2 88% on room air',
      status: 'IN_TREATMENT',
      triageNotes: 'Immediate oxygen therapy started. Attending Dr. James Wilson on scene in ER Bay 1.',
      assignedDoctorId: doctorProfile5.id,
      registeredById: receptionistUser.id,
    },
  });

  await prisma.emergencyRegistration.create({
    data: {
      emergencyNumber: 'EMG-2026-002',
      patientId: createdPatients[5].id, // Thomas Wright
      arrivedAt: yesterday,
      priority: 'HIGH',
      reason: 'Acute musculoskeletal trauma following fall from ladder, severe lumbar spasm',
      status: 'ADMITTED',
      triageNotes: 'X-Ray ordered, immobilized and transferred to Ward 3B.',
      assignedDoctorId: doctorProfile4.id,
      registeredById: receptionistUser.id,
    },
  });

  await prisma.emergencyRegistration.create({
    data: {
      emergencyNumber: 'EMG-2026-003',
      patientId: createdPatients[6].id, // Sophia Martinez
      arrivedAt: twoDaysAgo,
      priority: 'MEDIUM',
      reason: 'Severe migraine headache with intractable vomiting and photophobia',
      status: 'DISCHARGED',
      triageNotes: 'IV fluids and anti-emetics administered. Discharged after 4 hours with prescription.',
      assignedDoctorId: doctorProfile2.id,
      registeredById: receptionistUser.id,
    },
  });

  // ── 16. Pharmacy: Medicine Catalog (16 Realistic Formulations) ──
  console.log('Seeding Pharmacy Catalog Medicines & Batches...');
  const medicineData = [
    {
      medicineCode: 'MED-2026-001',
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      brandName: 'Amoxil / Moxikind',
      category: 'Antibiotic',
      manufacturer: 'GlaxoSmithKline Healthcare',
      strength: '500mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      unit: 'Capsules',
      sellingPrice: 12.50,
      reorderLevel: 30,
      status: 'Active',
      description: 'Broad-spectrum beta-lactam antibiotic for bacterial infections including ENT, respiratory, and urinary tract.',
    },
    {
      medicineCode: 'MED-2026-002',
      name: 'Paracetamol 650mg',
      genericName: 'Acetaminophen',
      brandName: 'Calpol / Dolo 650',
      category: 'Analgesic & Antipyretic',
      manufacturer: 'Micro Labs Ltd',
      strength: '650mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 3.50,
      reorderLevel: 50,
      status: 'Active',
      description: 'First-line antipyretic and mild-to-moderate analgesic for fever, headache, and body aches.',
    },
    {
      medicineCode: 'MED-2026-003',
      name: 'Azithromycin 500mg',
      genericName: 'Azithromycin Dihydrate',
      brandName: 'Zithromax / Azithral',
      category: 'Antibiotic (Macrolide)',
      manufacturer: 'Alembic Pharmaceuticals',
      strength: '500mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 18.00,
      reorderLevel: 25,
      status: 'Active',
      description: 'Macrolide antibiotic for community-acquired pneumonia, acute bacterial sinusitis, and soft tissue infections.',
    },
    {
      medicineCode: 'MED-2026-004',
      name: 'Metformin 500mg',
      genericName: 'Metformin Hydrochloride',
      brandName: 'Glucophage / Glycomet',
      category: 'Antidiabetic (Biguanide)',
      manufacturer: 'USV Private Limited',
      strength: '500mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 6.00,
      reorderLevel: 40,
      status: 'Active',
      description: 'First-choice oral antihyperglycemic for glycemic management in Type 2 Diabetes Mellitus.',
    },
    {
      medicineCode: 'MED-2026-005',
      name: 'Atorvastatin 20mg',
      genericName: 'Atorvastatin Calcium',
      brandName: 'Lipitor / Atorva',
      category: 'Cardiovascular (Statin)',
      manufacturer: 'Pfizer Global Health',
      strength: '20mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 14.50,
      reorderLevel: 30,
      status: 'Active',
      description: 'HMG-CoA reductase inhibitor for lipid reduction, hypercholesterolemia, and cardiovascular risk reduction.',
    },
    {
      medicineCode: 'MED-2026-006',
      name: 'Amlodipine 5mg',
      genericName: 'Amlodipine Besylate',
      brandName: 'Norvasc / Amlong',
      category: 'Antihypertensive (CCB)',
      manufacturer: 'Cadila Healthcare',
      strength: '5mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 5.00,
      reorderLevel: 25,
      status: 'Active',
      description: 'Dihydropyridine calcium channel blocker for systemic hypertension and chronic stable angina.',
    },
    {
      medicineCode: 'MED-2026-007',
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole Magnesium',
      brandName: 'Prilosec / Omez',
      category: 'Gastrointestinal (PPI)',
      manufacturer: 'Dr. Reddy\'s Laboratories',
      strength: '20mg',
      dosageForm: 'Capsule',
      route: 'Oral',
      unit: 'Capsules',
      sellingPrice: 8.00,
      reorderLevel: 30,
      status: 'Active',
      description: 'Proton pump inhibitor for gastroesophageal reflux disease (GERD) and peptic ulcer prophylaxis.',
    },
    {
      medicineCode: 'MED-2026-008',
      name: 'Pantoprazole 40mg',
      genericName: 'Pantoprazole Sodium',
      brandName: 'Protonix / Pan 40',
      category: 'Gastrointestinal (PPI)',
      manufacturer: 'Alkem Laboratories',
      strength: '40mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 9.50,
      reorderLevel: 30,
      status: 'Active',
      description: 'Proton pump inhibitor indicated for erosive esophagitis and acid hypersecretion states.',
    },
    {
      medicineCode: 'MED-2026-009',
      name: 'Ceftriaxone 1g Injection',
      genericName: 'Ceftriaxone Sodium Sterile',
      brandName: 'Rocephin / Monocef',
      category: 'Antibiotic (Cephalosporin)',
      manufacturer: 'F. Hoffmann-La Roche Ltd',
      strength: '1g',
      dosageForm: 'Injection',
      route: 'IV',
      unit: 'Vials',
      sellingPrice: 22.00,
      reorderLevel: 20,
      status: 'Active',
      description: 'Third-generation cephalosporin for severe nosocomial infections, meningitis, and surgical prophylaxis.',
    },
    {
      medicineCode: 'MED-2026-010',
      name: 'Salbutamol Inhaler 100mcg',
      genericName: 'Albuterol Sulfate',
      brandName: 'Ventolin / Asthalin',
      category: 'Respiratory (Bronchodilator)',
      manufacturer: 'Cipla Respiratory',
      strength: '100mcg/puff',
      dosageForm: 'Inhaler',
      route: 'Inhalation',
      unit: 'Inhalers',
      sellingPrice: 16.00,
      reorderLevel: 15,
      status: 'Active',
      description: 'Short-acting beta-2 agonist for relief of acute bronchospasm in bronchial asthma and COPD.',
    },
    {
      medicineCode: 'MED-2026-011',
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine Dihydrochloride',
      brandName: 'Zyrtec / Cetzine',
      category: 'Antihistamine',
      manufacturer: 'Sun Pharma Industries',
      strength: '10mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 4.00,
      reorderLevel: 25,
      status: 'Active',
      description: 'Second-generation H1 receptor antagonist for seasonal allergic rhinitis, urticaria, and pruritus.',
    },
    {
      medicineCode: 'MED-2026-012',
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      brandName: 'Advil / Brufen',
      category: 'NSAID',
      manufacturer: 'Abbott Healthcare',
      strength: '400mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 5.50,
      reorderLevel: 30,
      status: 'Active',
      description: 'Non-steroidal anti-inflammatory drug for post-traumatic pain, arthralgia, and dysmenorrhea.',
    },
    {
      medicineCode: 'MED-2026-013',
      name: 'Ciprofloxacin 500mg',
      genericName: 'Ciprofloxacin Hydrochloride',
      brandName: 'Cipro / Ciplox',
      category: 'Antibiotic (Fluoroquinolone)',
      manufacturer: 'Cipla Ltd',
      strength: '500mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 11.00,
      reorderLevel: 20,
      status: 'Active',
      description: 'Fluoroquinolone antibiotic for complicated urinary tract and intra-abdominal infections.',
    },
    {
      medicineCode: 'MED-2026-014',
      name: 'Insulin Glargine 100IU/ml',
      genericName: 'Insulin Glargine Recombinant',
      brandName: 'Lantus Solostar',
      category: 'Antidiabetic (Basal Insulin)',
      manufacturer: 'Sanofi Aventis',
      strength: '100IU/ml',
      dosageForm: 'Injection',
      route: 'Subcutaneous',
      unit: 'Cartridges',
      sellingPrice: 48.00,
      reorderLevel: 10,
      status: 'Active',
      description: 'Recombinant 24-hour basal insulin analog for glycemic control in Type 1 & Type 2 Diabetes.',
    },
    {
      medicineCode: 'MED-2026-015',
      name: 'Ondansetron 4mg',
      genericName: 'Ondansetron Hydrochloride',
      brandName: 'Zofran / Emeset',
      category: 'Antiemetic (5-HT3 Antagonist)',
      manufacturer: 'GlaxoSmithKline',
      strength: '4mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 7.00,
      reorderLevel: 20,
      status: 'Active',
      description: 'Selective 5-HT3 receptor antagonist for post-operative and chemotherapy-induced nausea and vomiting.',
    },
    {
      medicineCode: 'MED-2026-016',
      name: 'Montelukast 10mg',
      genericName: 'Montelukast Sodium',
      brandName: 'Singulair / Montair',
      category: 'Respiratory (Leukotriene Inhibitor)',
      manufacturer: 'Merck & Co.',
      strength: '10mg',
      dosageForm: 'Tablet',
      route: 'Oral',
      unit: 'Tablets',
      sellingPrice: 13.50,
      reorderLevel: 20,
      status: 'Active',
      description: 'Leukotriene receptor antagonist for prophylaxis and chronic management of bronchial asthma and allergic rhinitis.',
    },
  ];

  const createdMedicines = [];
  for (const m of medicineData) {
    const med = await prisma.medicine.create({ data: m });
    createdMedicines.push(med);
  }

  // ── 17. Batches & Opening Stock Transactions ──
  // Date helpers for realistic expiry buckets
  const expiryFresh1 = new Date(Date.now() + 380 * 86400000); // ~13 months out (2027)
  const expiryFresh2 = new Date(Date.now() + 540 * 86400000); // ~18 months out (2027/2028)
  const expiry30Days = new Date(Date.now() + 18 * 86400000);  // 18 days (30-day bucket)
  const expiry60Days = new Date(Date.now() + 45 * 86400000);  // 45 days (60-day bucket)
  const expiry90Days = new Date(Date.now() + 75 * 86400000);  // 75 days (90-day bucket)
  const expiryExpired = new Date(Date.now() - 14 * 86400000); // 14 days ago (Expired)

  const batchesPlan = [
    // Med 0: Amoxicillin 500mg (2 batches: 1 fresh, 1 expiring in 60d)
    { medIdx: 0, batchNo: 'BAT-2026-01A', qty: 150, cost: 7.50, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 0, batchNo: 'BAT-2025-08X', qty: 40, cost: 7.00, expiry: expiry60Days, status: 'Active' },
    
    // Med 1: Paracetamol 650mg (2 batches: 1 fresh, 1 near 30d expiry)
    { medIdx: 1, batchNo: 'BAT-2026-02A', qty: 300, cost: 1.80, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 1, batchNo: 'BAT-2025-09P', qty: 80, cost: 1.50, expiry: expiry30Days, status: 'Active' },

    // Med 2: Azithromycin 500mg (2 batches: 1 fresh, 1 expired)
    { medIdx: 2, batchNo: 'BAT-2026-03A', qty: 90, cost: 11.00, expiry: expiryFresh2, status: 'Active' },
    { medIdx: 2, batchNo: 'BAT-2024-11Z', qty: 25, cost: 10.50, expiry: expiryExpired, status: 'Expired' },

    // Med 3: Metformin 500mg (2 batches)
    { medIdx: 3, batchNo: 'BAT-2026-04A', qty: 200, cost: 3.20, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 3, batchNo: 'BAT-2025-10M', qty: 50, cost: 3.00, expiry: expiry90Days, status: 'Active' },

    // Med 4: Atorvastatin 20mg (2 batches)
    { medIdx: 4, batchNo: 'BAT-2026-05A', qty: 120, cost: 8.50, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 4, batchNo: 'BAT-2025-07L', qty: 35, cost: 8.00, expiry: expiry60Days, status: 'Active' },

    // Med 5: Amlodipine 5mg (2 batches)
    { medIdx: 5, batchNo: 'BAT-2026-06A', qty: 180, cost: 2.80, expiry: expiryFresh2, status: 'Active' },
    { medIdx: 5, batchNo: 'BAT-2025-12A', qty: 45, cost: 2.50, expiry: expiry90Days, status: 'Active' },

    // Med 6: Omeprazole 20mg (2 batches)
    { medIdx: 6, batchNo: 'BAT-2026-07A', qty: 100, cost: 4.50, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 6, batchNo: 'BAT-2025-08O', qty: 30, cost: 4.20, expiry: expiry30Days, status: 'Active' },

    // Med 7: Pantoprazole 40mg (2 batches)
    { medIdx: 7, batchNo: 'BAT-2026-08A', qty: 160, cost: 5.50, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 7, batchNo: 'BAT-2025-11P', qty: 50, cost: 5.00, expiry: expiry90Days, status: 'Active' },

    // Med 8: Ceftriaxone 1g Injection (Low stock test: 8 units available, reorder is 20)
    { medIdx: 8, batchNo: 'BAT-2026-09A', qty: 8, cost: 14.00, expiry: expiryFresh1, status: 'Active' },

    // Med 9: Salbutamol Inhaler (Low stock test: 5 units available, reorder is 15)
    { medIdx: 9, batchNo: 'BAT-2026-10A', qty: 5, cost: 9.50, expiry: expiryFresh1, status: 'Active' },

    // Med 10: Cetirizine 10mg (2 batches)
    { medIdx: 10, batchNo: 'BAT-2026-11A', qty: 220, cost: 2.10, expiry: expiryFresh2, status: 'Active' },
    { medIdx: 10, batchNo: 'BAT-2025-09C', qty: 40, cost: 2.00, expiry: expiry60Days, status: 'Active' },

    // Med 11: Ibuprofen 400mg (Low stock test: 12 units available, reorder is 30)
    { medIdx: 11, batchNo: 'BAT-2026-12A', qty: 12, cost: 3.10, expiry: expiryFresh1, status: 'Active' },

    // Med 12: Ciprofloxacin 500mg (2 batches)
    { medIdx: 12, batchNo: 'BAT-2026-13A', qty: 85, cost: 6.20, expiry: expiryFresh1, status: 'Active' },
    { medIdx: 12, batchNo: 'BAT-2025-06C', qty: 20, cost: 6.00, expiry: expiry30Days, status: 'Active' },

    // Med 13: Insulin Glargine (Low stock test: 4 units available, reorder is 10)
    { medIdx: 13, batchNo: 'BAT-2026-14A', qty: 4, cost: 32.00, expiry: expiryFresh1, status: 'Active' },

    // Med 14: Ondansetron 4mg (Low stock test: 7 units available, reorder is 20)
    { medIdx: 14, batchNo: 'BAT-2026-15A', qty: 7, cost: 4.10, expiry: expiryFresh1, status: 'Active' },

    // Med 15: Montelukast 10mg (2 batches)
    { medIdx: 15, batchNo: 'BAT-2026-16A', qty: 110, cost: 8.00, expiry: expiryFresh2, status: 'Active' },
    { medIdx: 15, batchNo: 'BAT-2025-10K', qty: 30, cost: 7.80, expiry: expiry90Days, status: 'Active' },
  ];

  const createdBatches = [];
  let txnCounter = 1;

  for (const b of batchesPlan) {
    const med = createdMedicines[b.medIdx];
    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId: med.id,
        batchNumber: b.batchNo,
        manufacturer: med.manufacturer,
        supplier: 'Apollo Pharma Distribution Ltd',
        receivedDate: new Date(Date.now() - 30 * 86400000),
        expiryDate: b.expiry,
        quantityReceived: b.qty,
        quantityAvailable: b.qty, // Matches initial receipt
        purchaseCost: b.cost,
        sellingPrice: med.sellingPrice,
        status: b.status,
      },
    });
    createdBatches.push(batch);

    // Write opening RECEIPT ledger transaction so quantity == sum(ledger)
    const txnNumber = `TXN-2026-${String(txnCounter++).padStart(4, '0')}`;
    await prisma.stockTransaction.create({
      data: {
        transactionNumber: txnNumber,
        medicineId: med.id,
        batchId: batch.id,
        quantityChange: b.qty,
        type: 'RECEIPT',
        reason: 'Initial opening stock intake from verified distributor',
        balanceAfter: b.qty,
        performedById: pharmacistUser.id,
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
    });
  }

  // ── 18. Prescriptions: Doctor E-Prescriptions & Items ──
  console.log('Seeding Prescriptions with mapped catalog items...');
  const prescriptionsData = [
    // Rx 1: For Robert Sterling (Dr. Sarah Chen) - Pending Dispense
    {
      prescriptionNumber: 'RX-2026-001',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      notes: 'Post-CABG cardiovascular secondary prophylaxis. Monitor BP weekly.',
      dispensingStatus: 'PENDING',
      items: [
        {
          medicineId: createdMedicines[4].id, // Atorvastatin 20mg
          medicineName: 'Atorvastatin 20mg',
          dosage: '20mg',
          frequency: '0-0-1 (Once at Night)',
          duration: '30 Days',
          quantityPrescribed: 30,
          quantityDispensed: 0,
          instructions: 'Take 1 tablet daily after dinner',
        },
        {
          medicineId: createdMedicines[5].id, // Amlodipine 5mg
          medicineName: 'Amlodipine 5mg',
          dosage: '5mg',
          frequency: '1-0-0 (Once in Morning)',
          duration: '30 Days',
          quantityPrescribed: 30,
          quantityDispensed: 0,
          instructions: 'Take in the morning with water before food',
        },
      ],
    },
    // Rx 2: For Elena Rostova (Dr. Sarah Chen) - Pending Dispense
    {
      prescriptionNumber: 'RX-2026-002',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      notes: 'Upper respiratory tract infection. Complete 5-day antibiotic course.',
      dispensingStatus: 'PENDING',
      items: [
        {
          medicineId: createdMedicines[0].id, // Amoxicillin 500mg
          medicineName: 'Amoxicillin 500mg',
          dosage: '500mg',
          frequency: '1-0-1 (Twice Daily)',
          duration: '5 Days',
          quantityPrescribed: 10,
          quantityDispensed: 0,
          instructions: 'Complete full 5-day course. Take with meals.',
        },
        {
          medicineId: createdMedicines[1].id, // Paracetamol 650mg
          medicineName: 'Paracetamol 650mg',
          dosage: '650mg',
          frequency: '1-1-1 (SOS / 3 Times Daily for Fever)',
          duration: '3 Days',
          quantityPrescribed: 10,
          quantityDispensed: 0,
          instructions: 'Take as needed for temperature > 99.5°F',
        },
      ],
    },
    // Rx 3: For Clara Oswald (Dr. James Wilson) - On Hold
    {
      prescriptionNumber: 'RX-2026-003',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      notes: 'Bronchial asthma exacerbation with nocturnal wheezing.',
      dispensingStatus: 'ON_HOLD',
      onHold: true,
      holdReason: 'Potential allergen cross-reactivity flagged by pharmacist. Clarification requested from Dr. Wilson.',
      heldById: pharmacistUser.id,
      heldAt: new Date(Date.now() - 3 * 3600000),
      items: [
        {
          medicineId: createdMedicines[9].id, // Salbutamol Inhaler
          medicineName: 'Salbutamol Inhaler 100mcg',
          dosage: '100mcg/puff',
          frequency: '2 puffs SOS (as needed)',
          duration: '30 Days',
          quantityPrescribed: 1,
          quantityDispensed: 0,
          instructions: 'Inhale 2 puffs with spacer during acute shortness of breath',
        },
        {
          medicineId: createdMedicines[15].id, // Montelukast 10mg
          medicineName: 'Montelukast 10mg',
          dosage: '10mg',
          frequency: '0-0-1 (Nightly)',
          duration: '15 Days',
          quantityPrescribed: 15,
          quantityDispensed: 0,
          instructions: 'Take 1 tablet every night before sleep',
        },
      ],
    },
    // Rx 4: For Thomas Wright (Dr. Sarah Chen) - Partially Dispensed Seed
    {
      prescriptionNumber: 'RX-2026-004',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[5].id,
      notes: 'Type 2 Diabetes Mellitus with Dyslipidemia regular prescription.',
      dispensingStatus: 'PARTIALLY_DISPENSED',
      items: [
        {
          medicineId: createdMedicines[3].id, // Metformin 500mg
          medicineName: 'Metformin 500mg',
          dosage: '500mg',
          frequency: '1-0-1 (Twice Daily)',
          duration: '30 Days',
          quantityPrescribed: 60,
          quantityDispensed: 30, // 30 dispensed earlier
          instructions: 'Take with main meals (breakfast & dinner)',
        },
        {
          medicineId: createdMedicines[7].id, // Pantoprazole 40mg
          medicineName: 'Pantoprazole 40mg',
          dosage: '40mg',
          frequency: '1-0-0 (Morning Fasting)',
          duration: '15 Days',
          quantityPrescribed: 15,
          quantityDispensed: 0,
          instructions: 'Take 30 mins before morning breakfast',
        },
      ],
    },
    // Rx 5: For Marcus Vance (Dr. Marcus Vance OPD) - Pending Dispense
    {
      prescriptionNumber: 'RX-2026-005',
      doctorId: doctorProfile3.id,
      patientId: createdPatients[2].id,
      notes: 'Acute gastroenteritis with mild dehydration.',
      dispensingStatus: 'PENDING',
      items: [
        {
          medicineId: createdMedicines[12].id, // Ciprofloxacin 500mg
          medicineName: 'Ciprofloxacin 500mg',
          dosage: '500mg',
          frequency: '1-0-1 (Twice Daily)',
          duration: '5 Days',
          quantityPrescribed: 10,
          quantityDispensed: 0,
          instructions: 'Drink plenty of water. Avoid dairy products within 2 hours of dose.',
        },
        {
          medicineId: createdMedicines[14].id, // Ondansetron 4mg
          medicineName: 'Ondansetron 4mg',
          dosage: '4mg',
          frequency: '1-0-1 (Twice Daily before meals)',
          duration: '3 Days',
          quantityPrescribed: 6,
          quantityDispensed: 0,
          instructions: 'Take 30 mins before meals to control nausea',
        },
      ],
    },
  ];

  const createdPrescriptions = [];
  for (const rx of prescriptionsData) {
    const { items, ...rxData } = rx;
    const createdRx = await prisma.prescription.create({
      data: {
        ...rxData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
    createdPrescriptions.push(createdRx);
  }

  // ── 19. Dispensing Records (Fulfilled Dispensing + Shared Billing Sync) ──
  console.log('Seeding Dispensing Transactions & Billing integration...');
  // Dispense for Rx 4 (Thomas Wright - 30 Metformin)
  const rx4 = createdPrescriptions[3];
  const rx4MetforminItem = rx4.items[0];
  const metforminBatch = createdBatches[6]; // BAT-2026-04A
  const dispenseQty = 30;
  const unitPrice = 6.00;
  const totalAmount = dispenseQty * unitPrice; // $180.00

  // Deduct from batch
  const updatedBatch = await prisma.medicineBatch.update({
    where: { id: metforminBatch.id },
    data: { quantityAvailable: metforminBatch.quantityAvailable - dispenseQty },
  });

  // Create Dispensing
  const dispensing1 = await prisma.dispensing.create({
    data: {
      dispensingNumber: 'DSP-2026-0001',
      prescriptionId: rx4.id,
      patientId: rx4.patientId,
      pharmacistId: pharmacistUser.id,
      status: 'Completed',
      idempotencyKey: `SEED-IDEM-DSP-0001-${Date.now()}`,
      totalAmount: totalAmount,
      notes: 'Initial 15-day partial fulfillment dispensed per patient request.',
      createdAt: yesterday,
      items: {
        create: [
          {
            prescriptionItemId: rx4MetforminItem.id,
            medicineId: createdMedicines[3].id,
            batchId: metforminBatch.id,
            medicineNameSnapshot: 'Metformin 500mg',
            batchNumberSnapshot: metforminBatch.batchNumber,
            quantity: dispenseQty,
            unitPriceSnapshot: unitPrice,
            totalPrice: totalAmount,
            instructionsSnapshot: rx4MetforminItem.instructions,
            createdAt: yesterday,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Write DISPENSE Stock Transaction
  await prisma.stockTransaction.create({
    data: {
      transactionNumber: `TXN-2026-${String(txnCounter++).padStart(4, '0')}`,
      medicineId: createdMedicines[3].id,
      batchId: metforminBatch.id,
      quantityChange: -dispenseQty,
      type: 'DISPENSE',
      reason: `Dispensed for Prescription #${rx4.prescriptionNumber} (Thomas Wright)`,
      balanceAfter: updatedBatch.quantityAvailable,
      performedById: pharmacistUser.id,
      dispensingId: dispensing1.id,
      createdAt: yesterday,
    },
  });

  // Link to Thomas Wright's Invoice
  const thomasInvoice = await prisma.invoice.findFirst({
    where: { patientId: rx4.patientId },
  });
  if (thomasInvoice) {
    await prisma.invoiceItem.create({
      data: {
        invoiceId: thomasInvoice.id,
        serviceName: 'Pharmacy: Metformin 500mg (30 Tablets)',
        category: 'Pharmacy',
        source: 'PHARMACY',
        dispensingItemId: dispensing1.items[0].id,
        unitPrice: unitPrice,
        quantity: dispenseQty,
        totalPrice: totalAmount,
        createdAt: yesterday,
      },
    });

    await prisma.dispensing.update({
      where: { id: dispensing1.id },
      data: { invoiceId: thomasInvoice.id },
    });
  }

  // ── 20. Pharmacist Notifications ──
  console.log('Seeding Pharmacist Notifications...');
  await prisma.notification.create({
    data: {
      userId: pharmacistUser.id,
      title: 'New Prescription Queued',
      message: 'Dr. Sarah Chen generated E-Prescription #RX-2026-001 for Robert Sterling (Cardiology OPD).',
      type: 'INFO',
      isRead: false,
      entityType: 'Prescription',
      entityId: createdPrescriptions[0].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pharmacistUser.id,
      title: 'Low Stock Alert: Insulin Glargine',
      message: 'Insulin Glargine 100IU/ml has only 4 cartridges remaining (Reorder Threshold: 10).',
      type: 'URGENT',
      isRead: false,
      entityType: 'Medicine',
      entityId: createdMedicines[13].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pharmacistUser.id,
      title: 'Low Stock Alert: Salbutamol Inhaler',
      message: 'Salbutamol Inhaler 100mcg has only 5 inhalers remaining (Reorder Threshold: 15).',
      type: 'URGENT',
      isRead: false,
      entityType: 'Medicine',
      entityId: createdMedicines[9].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pharmacistUser.id,
      title: 'Near Expiry Warning',
      message: 'Omeprazole 20mg (Batch BAT-2025-08O) expires in 18 days (30 Units available).',
      type: 'URGENT',
      isRead: false,
      entityType: 'MedicineBatch',
      entityId: createdBatches[13].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: pharmacistUser.id,
      title: 'Prescription Placed On Hold',
      message: 'Prescription #RX-2026-003 for Clara Oswald was placed on hold for clinical clarification.',
      type: 'INFO',
      isRead: true,
      readAt: new Date(Date.now() - 3600000),
      entityType: 'Prescription',
      entityId: createdPrescriptions[2].id,
    },
  });

  // 21. 5 Front Desk / Receptionist Notifications
  await prisma.notification.create({
    data: {
      userId: receptionistUser.id,
      title: 'Patient Checked In',
      message: 'Robert Sterling (MC-2026-000101) has checked in for 09:30 AM with Dr. Sarah Chen. Waiting in Lobby.',
      type: 'INFO',
      isRead: false,
      entityType: 'Appointment',
      entityId: createdAppointments[0].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: receptionistUser.id,
      title: 'Critical Emergency Intake',
      message: 'Arthur Pendelton registered in Critical priority to ER Bay 1 under Dr. James Wilson.',
      type: 'URGENT',
      isRead: false,
      entityType: 'EmergencyRegistration',
    },
  });

  await prisma.notification.create({
    data: {
      userId: receptionistUser.id,
      title: 'Payment Received',
      message: 'Payment of $1,050.00 via UPI recorded for Invoice #INV-2026-0001 (Robert Sterling).',
      type: 'INFO',
      isRead: false,
      entityType: 'Payment',
    },
  });

  await prisma.notification.create({
    data: {
      userId: receptionistUser.id,
      title: 'Pending Invoice Clearance',
      message: 'Invoice #INV-2026-0003 for Grace Kim has $1,700.00 outstanding balance.',
      type: 'INFO',
      isRead: true,
      readAt: new Date(Date.now() - 2 * 3600000),
      entityType: 'Invoice',
    },
  });

  await prisma.notification.create({
    data: {
      userId: receptionistUser.id,
      title: 'Shift Roster Notice',
      message: 'Morning Front Desk roster active (08:00 - 16:00). Supervisor: Emily Watson.',
      type: 'INFO',
      isRead: true,
      readAt: yesterday,
    },
  });

  // Also seed Nurse & Doctor Notifications so existing modules stay populated
  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'Patient Arrived (Front Desk)',
      message: 'Robert Sterling has arrived and checked in at Front Desk for his 09:30 AM appointment.',
      type: 'APPOINTMENT',
      isRead: false,
      entityType: 'Appointment',
      entityId: createdAppointments[0].id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'Inpatient Assigned',
      message: 'Robert Sterling is currently in Ward 3B, Bed 1 under Dr. Sarah Chen.',
      type: 'INFO',
      isRead: false,
      entityType: 'Admission',
    },
  });

  console.log('✅ Seed completed successfully with full Multi-Role Dataset (Doctor + Nurse + Receptionist + Pharmacist)!');
  console.log(`- 1 Hospital`);
  console.log(`- 1 Receptionist user (receptionist@medcore.health / Receptionist@123) & profile created`);
  console.log(`- 1 Pharmacist user (pharmacist@medcore.health / Pharmacist@123) & profile created`);
  console.log(`- 5 Doctors across 3 Departments created with full weekly schedules`);
  console.log(`- 2 Nurses created with active assignments`);
  console.log(`- 10 Realistic Patients created with unique IDs`);
  console.log(`- 16 Pharmacy Catalog Medicines created`);
  console.log(`- 27 Medicine Batches with varied expiries and opening stock ledger rows`);
  console.log(`- 5 Prescriptions with mapped items and hold workflows`);
  console.log(`- 1 Dispensing transaction linked to shared billing`);
  console.log(`- 9 Service Catalog billing master items created`);
  console.log(`- 8 Hospital Beds across 3 Wards created`);
  console.log(`- 3 Inpatient Admissions created`);
  console.log(`- 15 Doctor Appointments across today/upcoming/past with checked-in & waiting status`);
  console.log(`- 5 Invoices (Pending, Partially Paid, Paid) created`);
  console.log(`- 8 Payments across Cash, Card, UPI, and Bank Transfer created`);
  console.log(`- 3 Emergency Registrations created`);
  console.log(`- Notifications created for Receptionist, Doctor, Nurse, and Pharmacist`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
