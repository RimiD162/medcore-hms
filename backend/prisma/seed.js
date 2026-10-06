require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MedCore HMS Seed Data Generation (Full Multi-Role Ecosystem: Doctor + Nurse + Reception Desk)...');

  // 1. Fast truncate of all tables
  console.log('Cleaning existing database tables...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
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

  // 16. 5 Front Desk / Receptionist Notifications
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

  console.log('✅ Seed completed successfully with full Multi-Role Dataset (Doctor + Nurse + Receptionist)!');
  console.log(`- 1 Hospital`);
  console.log(`- 1 Receptionist user (receptionist@medcore.health / Receptionist@123) & profile created`);
  console.log(`- 5 Doctors across 3 Departments created with full weekly schedules`);
  console.log(`- 2 Nurses created with active assignments`);
  console.log(`- 10 Realistic Patients created with unique IDs`);
  console.log(`- 9 Service Catalog billing master items created`);
  console.log(`- 8 Hospital Beds across 3 Wards created`);
  console.log(`- 3 Inpatient Admissions created`);
  console.log(`- 15 Doctor Appointments across today/upcoming/past with checked-in & waiting status`);
  console.log(`- 5 Invoices (Pending, Partially Paid, Paid) created`);
  console.log(`- 8 Payments across Cash, Card, UPI, and Bank Transfer created`);
  console.log(`- 3 Emergency Registrations created`);
  console.log(`- Notifications created for Receptionist, Doctor, and Nurse`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
