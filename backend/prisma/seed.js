require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MedCore HMS Seed Data Generation (Doctor + Nurse Ecosystem)...');

  // 1. Fast truncate of all tables
  console.log('Cleaning existing database tables...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
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

  // 3. Doctors
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
      bio: 'Board-certified cardiologist specializing in preventive cardiology, hypertension management, echocardiography, and coronary interventions with over 12 years of clinical excellence.',
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

  // Doctor Weekly Availabilities
  const scheduleDays = [1, 2, 3, 4, 5];
  for (const day of scheduleDays) {
    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorProfile1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        consultationDuration: 15,
        isActive: true,
      },
    });

    await prisma.doctorAvailability.create({
      data: {
        doctorId: doctorProfile2.id,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '16:30',
        breakStartTime: '12:30',
        breakEndTime: '13:30',
        consultationDuration: 20,
        isActive: true,
      },
    });
  }

  // 4. Nurses
  // Nurse 1: Nurse Sarah Jenkins (Senior Charge Nurse, Ward 3B)
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

  // Nurse 2: Nurse David Kim (Critical Care & Triage Nurse, Ward 2A)
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

  // 5. 5 Realistic Patients
  const patientsData = [
    {
      patientIdNumber: 'MED-P-1001',
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
    },
    {
      patientIdNumber: 'MED-P-1002',
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
    },
    {
      patientIdNumber: 'MED-P-1003',
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
    },
    {
      patientIdNumber: 'MED-P-1004',
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
    },
    {
      patientIdNumber: 'MED-P-1005',
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

  // 6. Nurse Assignments
  // Nurse Sarah Jenkins assigned to Robert Sterling, Elena Rostova, Clara Oswald
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
      nurseId: nurseProfile1.id,
      patientId: createdPatients[2].id,
      ward: 'OPD Observation Bay 2',
      shift: 'Day',
      isActive: true,
      notes: 'Nebulization and peak flow monitoring.',
    },
  });

  // Nurse David Kim assigned to David Miller and Maya Patel
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

  await prisma.nurseAssignment.create({
    data: {
      nurseId: nurseProfile2.id,
      patientId: createdPatients[4].id,
      ward: 'OPD Triage',
      shift: 'Day',
      isActive: true,
      notes: 'Triage intake and vital signs check.',
    },
  });

  // 7. Beds & Wards (Nurse Read-Only View)
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
    await prisma.bed.create({
      data: b,
    });
  }

  // 8. Inpatient Admissions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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

  // 9. Appointments for Doctors
  const apt1 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-101',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      appointmentDate: today,
      appointmentTime: '09:30',
      type: 'Follow-up',
      status: 'CONFIRMED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 25 * 60 * 1000),
      reason: 'Routine BP monitoring and chest discomfort assessment',
    },
  });

  const apt2 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-102',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      appointmentDate: today,
      appointmentTime: '10:15',
      type: 'General',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Post-op 2-week checkup and wound healing review',
    },
  });

  const apt3 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-103',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      appointmentDate: today,
      appointmentTime: '11:00',
      type: 'Routine',
      status: 'COMPLETED',
      isCheckedIn: true,
      checkedInAt: new Date(Date.now() - 90 * 60 * 1000),
      reason: 'Asthma seasonal flare-up and inhaler dosage adjustment',
    },
  });

  const apt4 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-104',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[3].id,
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      type: 'Follow-up',
      status: 'CONFIRMED',
      isCheckedIn: false,
      reason: 'Quarterly HbA1c review and lipid profile monitoring',
    },
  });

  const apt5 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-105',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[4].id,
      appointmentDate: inThreeDays,
      appointmentTime: '11:30',
      type: 'Routine',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Thyroid panel review and fatigue evaluation',
    },
  });

  const apt6 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-106',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      appointmentDate: inFiveDays,
      appointmentTime: '14:00',
      type: 'Follow-up',
      status: 'SCHEDULED',
      isCheckedIn: false,
      reason: 'Post-medication 2-week cardiovascular check',
    },
  });

  const apt7 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-097',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      appointmentDate: yesterday,
      appointmentTime: '11:00',
      type: 'General',
      status: 'COMPLETED',
      isCheckedIn: true,
      reason: 'Acute pharyngitis and seasonal viral fever',
    },
  });

  const apt8 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2026-088',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      appointmentDate: lastWeek,
      appointmentTime: '15:30',
      type: 'General',
      status: 'CANCELLED',
      cancelReason: 'Patient requested reschedule due to unavoidable family travel',
      reason: 'Abdominal ultrasound review',
    },
  });

  // 10. Consultations & Prescriptions
  const cons1 = await prisma.consultation.create({
    data: {
      appointmentId: apt1.id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      status: 'DRAFT',
      chiefComplaint: 'Occasional morning dizziness and mild exertion tightness',
      symptoms: ['Mild Chest Heaviness', 'Dizziness', 'Morning Fatigue'],
      vitals: { bp: '142/92', heartRate: 78, temp: 98.4, spo2: 98, weight: 84, height: 178, bmi: 26.5 },
      clinicalNotes: 'Patient notes occasional missed doses of Telmisartan on weekends.',
      diagnosis: 'Essential Hypertension (Suboptimally controlled) with Stage 1 diastolic elevation',
      treatmentPlan: 'Increase Telmisartan to 80mg OD morning.',
      doctorNotes: 'Monitor home BP twice daily and report if systolic exceeds 150 mmHg.',
    },
  });

  const cons2 = await prisma.consultation.create({
    data: {
      appointmentId: apt3.id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      status: 'COMPLETED',
      chiefComplaint: 'Nocturnal wheezing and breathlessness triggered by cold air',
      symptoms: ['Nocturnal Cough', 'Wheezing', 'Shortness of Breath on exertion'],
      vitals: { bp: '122/78', heartRate: 82, temp: 98.6, spo2: 97, weight: 62, height: 165, bmi: 22.8 },
      clinicalNotes: 'Bilateral expiratory wheezing noted in mid and lower zones.',
      diagnosis: 'Moderate Persistent Asthma with seasonal allergic exacerbation',
      treatmentPlan: 'Initiate Budesonide + Formoterol inhaler 200/6 mcg 2 puffs BD.',
      doctorNotes: 'Instructed patient on correct spacer technique and peak flow meter diary.',
      completedAt: new Date(),
    },
  });

  const cons4 = await prisma.consultation.create({
    data: {
      appointmentId: apt7.id,
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      status: 'COMPLETED',
      chiefComplaint: 'Sore throat, difficulty swallowing, fever of 101F for 2 days',
      symptoms: ['High Grade Fever', 'Throat Pain', 'Body Aches'],
      vitals: { bp: '118/74', heartRate: 90, temp: 100.8, spo2: 98, weight: 58, height: 160, bmi: 22.7 },
      clinicalNotes: 'Pharyngeal erythema with tonsillar congestion.',
      diagnosis: 'Acute Viral Pharyngitis with upper respiratory tract infection',
      treatmentPlan: 'Paracetamol 650mg TDS PRN, Warm saline gargles, Vitamin C 500mg OD for 5 days.',
      doctorNotes: 'Advised rest and hydration.',
      completedAt: yesterday,
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
          {
            medicineName: 'Atorvastatin 20mg Tablet',
            dosage: '20mg',
            frequency: '0-0-1 (Once Daily Night)',
            duration: '30 Days',
            route: 'Oral',
            instructions: 'Take at night after dinner',
          },
        ],
      },
    },
    include: { items: true },
  });

  const rx2 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-102',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      consultationId: cons2.id,
      status: 'Active',
      notes: 'Rinse mouth thoroughly with water after using the inhaler.',
      prescribedDate: today,
      items: {
        create: [
          {
            medicineName: 'Budesonide + Formoterol Inhaler (200/6 mcg)',
            dosage: '200/6 mcg',
            frequency: '2 Puffs Twice Daily (1-0-1)',
            duration: '60 Days',
            route: 'Inhalation',
            instructions: 'Rinse mouth after each use to prevent oral thrush',
          },
          {
            medicineName: 'Levocetirizine 5mg Tablet',
            dosage: '5mg',
            frequency: '0-0-1 (Once Daily Night)',
            duration: '10 Days',
            route: 'Oral',
            instructions: 'Take at bedtime for allergic symptom control',
          },
        ],
      },
    },
    include: { items: true },
  });

  const rx3 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-103',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[3].id,
      status: 'Active',
      notes: 'Monitor fasting blood glucose every Monday morning.',
      prescribedDate: lastWeek,
      items: {
        create: [
          {
            medicineName: 'Metformin Hydrochloride 1000mg ER',
            dosage: '1000mg',
            frequency: '1-0-1 (Twice Daily with Meals)',
            duration: '60 Days',
            route: 'Oral',
            instructions: 'Swallow whole with main meals',
          },
          {
            medicineName: 'Dapagliflozin 10mg Tablet',
            dosage: '10mg',
            frequency: '1-0-0 (Once Daily Morning)',
            duration: '60 Days',
            route: 'Oral',
            instructions: 'Take in the morning with adequate water intake',
          },
        ],
      },
    },
    include: { items: true },
  });

  const rx4 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-104',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[1].id,
      status: 'Active',
      notes: 'Post-surgical pain management as needed.',
      prescribedDate: yesterday,
      items: {
        create: [
          {
            medicineName: 'Pantoprazole 40mg Tablet',
            dosage: '40mg',
            frequency: '1-0-0 (Once Daily Morning)',
            duration: '10 Days',
            route: 'Oral',
            instructions: 'Take 30 minutes before breakfast',
          },
          {
            medicineName: 'Paracetamol 650mg Tablet',
            dosage: '650mg',
            frequency: '1-0-1 (Twice Daily as needed)',
            duration: '5 Days',
            route: 'Oral',
            instructions: 'Take after meals for mild pain relief',
          },
        ],
      },
    },
    include: { items: true },
  });

  // 11. 12+ Vital Signs Records (Nurse Logged)
  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[0].id,
      nurseId: nurseProfile1.id,
      bloodPressure: '154/98',
      systolic: 154,
      diastolic: 98,
      temperature: 98.6,
      pulse: 84,
      respiratoryRate: 18,
      oxygenSaturation: 98,
      weight: 84.5,
      height: 178,
      observation: 'Patient admitted with morning headache. Blood pressure markedly elevated.',
      isFlagged: true,
      flagReason: 'High blood pressure (Systolic >= 140 / Diastolic >= 90)',
      recordedAt: new Date(Date.now() - 3 * 3600000), // 3h ago
    },
  });

  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[0].id,
      nurseId: nurseProfile1.id,
      bloodPressure: '138/88',
      systolic: 138,
      diastolic: 88,
      temperature: 98.4,
      pulse: 76,
      respiratoryRate: 16,
      oxygenSaturation: 99,
      weight: 84.2,
      height: 178,
      observation: 'Post-medication BP check showing gradual reduction. Patient resting comfortably.',
      isFlagged: false,
      flagReason: null,
      recordedAt: new Date(Date.now() - 1 * 3600000), // 1h ago
    },
  });

  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[1].id,
      nurseId: nurseProfile1.id,
      bloodPressure: '118/76',
      systolic: 118,
      diastolic: 76,
      temperature: 98.4,
      pulse: 72,
      respiratoryRate: 16,
      oxygenSaturation: 99,
      weight: 64.0,
      height: 168,
      observation: 'Post-op Day 2 routine vitals. Incision clean, no fever, ambulating without support.',
      isFlagged: false,
      flagReason: null,
      recordedAt: new Date(Date.now() - 4 * 3600000),
    },
  });

  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[2].id,
      nurseId: nurseProfile1.id,
      bloodPressure: '124/80',
      systolic: 124,
      diastolic: 80,
      temperature: 98.6,
      pulse: 88,
      respiratoryRate: 22,
      oxygenSaturation: 95,
      weight: 62.0,
      height: 165,
      observation: 'Mild tachypnea noted on intake. Peak flow measured at 320 L/min before inhaler.',
      isFlagged: true,
      flagReason: 'Elevated respiratory rate (> 20 breaths/min)',
      recordedAt: new Date(Date.now() - 2 * 3600000),
    },
  });

  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[3].id,
      nurseId: nurseProfile2.id,
      bloodPressure: '132/84',
      systolic: 132,
      diastolic: 84,
      temperature: 98.2,
      pulse: 74,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 76.5,
      height: 172,
      observation: 'Morning vitals and pre-breakfast glucose check. Heart rhythm regular on monitor.',
      isFlagged: false,
      flagReason: null,
      recordedAt: new Date(Date.now() - 5 * 3600000),
    },
  });

  await prisma.vitalSign.create({
    data: {
      patientId: createdPatients[4].id,
      nurseId: nurseProfile2.id,
      bloodPressure: '116/74',
      systolic: 116,
      diastolic: 74,
      temperature: 99.1,
      pulse: 82,
      respiratoryRate: 16,
      oxygenSaturation: 99,
      weight: 58.0,
      height: 160,
      observation: 'OPD follow-up vitals. Low-grade temperature noted, pharyngeal congestion resolving.',
      isFlagged: false,
      flagReason: null,
      recordedAt: yesterday,
    },
  });

  // 12. 8+ Nursing Notes
  await prisma.nursingNote.create({
    data: {
      patientId: createdPatients[0].id,
      nurseId: nurseProfile1.id,
      shift: 'Day Shift (08:00 - 16:00)',
      observation: 'Patient admitted from OPD with acute blood pressure elevation (154/98 mmHg) and occipital headache.',
      careProvided: 'Assisted patient to bed in semi-Fowler position. Administered Telmisartan 80mg orally per Dr. Chen order. Initiated low-sodium diet and fluid chart.',
      patientResponse: 'Patient reports headache intensity reduced from 6/10 to 2/10 within 90 minutes. Repeat BP 138/88.',
      additionalNotes: 'Continue 4-hourly blood pressure monitoring and maintain quiet environment.',
      isFlagged: true,
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
  });

  await prisma.nursingNote.create({
    data: {
      patientId: createdPatients[1].id,
      nurseId: nurseProfile1.id,
      shift: 'Day Shift (08:00 - 16:00)',
      observation: 'Post-laparoscopic appendectomy recovery day 2. Surgical port dressings inspected.',
      careProvided: 'Aseptic dressing change performed. Pantoprazole 40mg administered. Assisted patient with 15-minute hallway walk.',
      patientResponse: 'Patient tolerated ambulation well. No nausea or dizziness reported. Pain scored 1/10 on visual scale.',
      additionalNotes: 'Tolerating soft solid diet. Bowel sounds active in all 4 quadrants.',
      isFlagged: false,
      createdAt: new Date(Date.now() - 3 * 3600000),
    },
  });

  await prisma.nursingNote.create({
    data: {
      patientId: createdPatients[2].id,
      nurseId: nurseProfile1.id,
      shift: 'Day Shift (08:00 - 16:00)',
      observation: 'Patient arrived for scheduled asthma therapy evaluation with audible expiratory wheeze.',
      careProvided: 'Administered 2 puffs of Budesonide-Formoterol via aerochamber spacer. Supervised 10-second breath hold technique and mouth rinsing.',
      patientResponse: 'Expiratory wheezing markedly decreased. PEFR improved from 320 to 390 L/min post-inhalation.',
      additionalNotes: 'Patient demonstrated good spacer inhalation technique. Advised on home symptom diary.',
      isFlagged: false,
      createdAt: new Date(Date.now() - 1 * 3600000),
    },
  });

  await prisma.nursingNote.create({
    data: {
      patientId: createdPatients[3].id,
      nurseId: nurseProfile2.id,
      shift: 'Day Shift (08:00 - 16:00)',
      observation: 'Patient admitted for diabetic foot ulcer management and post-coronary stent surveillance.',
      careProvided: 'Right plantar superficial ulcer inspected, cleansed with sterile saline, and dressed with hydrocolloid dressing. Metformin 1000mg administered post-breakfast.',
      patientResponse: 'No localized tenderness or purulent discharge. Fasting blood sugar recorded at 118 mg/dL.',
      additionalNotes: 'Offloading shoe provided. Reminded patient to avoid bare-foot walking.',
      isFlagged: false,
      createdAt: new Date(Date.now() - 4 * 3600000),
    },
  });

  // 13. 10+ Medication Administration Tasks (e-MAR)
  // Task 1: Telmisartan (Robert Sterling - Administered today 08:30)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[0].id,
      nurseId: nurseProfile1.id,
      prescriptionItemId: rx1.items[0]?.id,
      medicineName: 'Telmisartan 80mg Tablet',
      dosage: '80mg',
      route: 'Oral',
      frequency: '1-0-0 (Once Daily Morning)',
      scheduledAt: new Date(today.getTime() + 8.5 * 3600000), // 08:30 today
      administeredAt: new Date(today.getTime() + 8.5 * 3600000),
      status: 'ADMINISTERED',
      reason: null,
      notes: 'Administered with water following breakfast. Patient tolerated well.',
    },
  });

  // Task 2: Amlodipine (Robert Sterling - Scheduled tonight 21:00)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[0].id,
      prescriptionItemId: rx1.items[1]?.id,
      medicineName: 'Amlodipine 5mg Tablet',
      dosage: '5mg',
      route: 'Oral',
      frequency: '0-0-1 (Once Daily Night)',
      scheduledAt: new Date(today.getTime() + 21 * 3600000), // 21:00 tonight
      administeredAt: null,
      status: 'SCHEDULED',
      reason: null,
      notes: 'Scheduled for bedtime administration.',
    },
  });

  // Task 3: Budesonide Inhaler (Clara Oswald - DUE NOW)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[2].id,
      prescriptionItemId: rx2.items[0]?.id,
      medicineName: 'Budesonide + Formoterol Inhaler (200/6 mcg)',
      dosage: '2 Puffs (200/6 mcg)',
      route: 'Inhalation',
      frequency: 'Twice Daily (1-0-1)',
      scheduledAt: new Date(Date.now() - 15 * 60000), // 15 mins ago (Due)
      administeredAt: null,
      status: 'DUE',
      reason: null,
      notes: 'Second daily dose due. Check spacer cleanliness.',
    },
  });

  // Task 4: Metformin (David Miller - Administered today 08:15)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[3].id,
      nurseId: nurseProfile2.id,
      prescriptionItemId: rx3.items[0]?.id,
      medicineName: 'Metformin Hydrochloride 1000mg ER',
      dosage: '1000mg',
      route: 'Oral',
      frequency: '1-0-1 (Twice Daily with Meals)',
      scheduledAt: new Date(today.getTime() + 8.25 * 3600000),
      administeredAt: new Date(today.getTime() + 8.25 * 3600000),
      status: 'ADMINISTERED',
      reason: null,
      notes: 'Given with morning meal.',
    },
  });

  // Task 5: Pantoprazole (Elena Rostova - Administered today 07:45)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[1].id,
      nurseId: nurseProfile1.id,
      prescriptionItemId: rx4.items[0]?.id,
      medicineName: 'Pantoprazole 40mg Tablet',
      dosage: '40mg',
      route: 'Oral',
      frequency: '1-0-0 (Once Daily Morning)',
      scheduledAt: new Date(today.getTime() + 7.75 * 3600000),
      administeredAt: new Date(today.getTime() + 7.75 * 3600000),
      status: 'ADMINISTERED',
      reason: null,
      notes: 'Administered 30 mins prior to morning tray.',
    },
  });

  // Task 6: Paracetamol 650mg (Elena Rostova - HELD)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[1].id,
      nurseId: nurseProfile1.id,
      prescriptionItemId: rx4.items[1]?.id,
      medicineName: 'Paracetamol 650mg Tablet',
      dosage: '650mg',
      route: 'Oral',
      frequency: 'PRN Pain Relief',
      scheduledAt: new Date(today.getTime() + 11 * 3600000),
      administeredAt: null,
      status: 'HELD',
      reason: 'Patient afebrile at 98.4F and reported zero postoperative pain (0/10). Medication held per clinical protocol.',
      notes: 'Re-evaluate if pain score exceeds 3/10.',
    },
  });

  // Task 7: Levocetirizine 5mg (Clara Oswald - Scheduled tonight)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[2].id,
      prescriptionItemId: rx2.items[1]?.id,
      medicineName: 'Levocetirizine 5mg Tablet',
      dosage: '5mg',
      route: 'Oral',
      frequency: '0-0-1 (Once Daily Night)',
      scheduledAt: new Date(today.getTime() + 22 * 3600000),
      administeredAt: null,
      status: 'SCHEDULED',
      reason: null,
      notes: 'Evening bedtime allergy dose.',
    },
  });

  // Task 8: Atorvastatin 20mg (Robert Sterling - Scheduled tonight)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[0].id,
      prescriptionItemId: rx1.items[2]?.id,
      medicineName: 'Atorvastatin 20mg Tablet',
      dosage: '20mg',
      route: 'Oral',
      frequency: '0-0-1 (Once Daily Night)',
      scheduledAt: new Date(today.getTime() + 21.5 * 3600000),
      administeredAt: null,
      status: 'SCHEDULED',
      reason: null,
      notes: 'Evening post-dinner lipid dose.',
    },
  });

  // Task 9: Dapagliflozin 10mg (David Miller - Administered today 08:30)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[3].id,
      nurseId: nurseProfile2.id,
      prescriptionItemId: rx3.items[1]?.id,
      medicineName: 'Dapagliflozin 10mg Tablet',
      dosage: '10mg',
      route: 'Oral',
      frequency: '1-0-0 (Once Daily Morning)',
      scheduledAt: new Date(today.getTime() + 8.5 * 3600000),
      administeredAt: new Date(today.getTime() + 8.5 * 3600000),
      status: 'ADMINISTERED',
      reason: null,
      notes: 'Administered with water.',
    },
  });

  // Task 10: Vitamin D3 (David Miller - MISSED)
  await prisma.medicationAdministration.create({
    data: {
      patientId: createdPatients[3].id,
      nurseId: nurseProfile2.id,
      medicineName: 'Vitamin D3 60,000 IU Capsule',
      dosage: '60,000 IU',
      route: 'Oral',
      frequency: 'Once Weekly',
      scheduledAt: new Date(yesterday.getTime() + 10 * 3600000),
      administeredAt: null,
      status: 'MISSED',
      reason: 'Patient off unit undergoing scheduled Doppler ultrasound during scheduled administration window.',
      notes: 'Rescheduled for today with attending physician approval.',
    },
  });

  // 14. 5 Nurse Notifications
  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'New Inpatient Assigned',
      message: 'Robert Sterling (MED-P-1001) has been admitted to Ward 3B, Bed 1 under Dr. Sarah Chen.',
      type: 'INFO',
      isRead: false,
      entityType: 'Admission',
    },
  });

  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'Medication Administration Due',
      message: 'Budesonide Inhaler is DUE NOW for Clara Oswald (Ward Observation Bay 2).',
      type: 'URGENT',
      isRead: false,
      entityType: 'MedicationAdministration',
    },
  });

  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'Vital Signs Scheduled',
      message: 'Ward 3B 4-hourly blood pressure monitoring round is due in 30 minutes.',
      type: 'INFO',
      isRead: false,
      entityType: 'VitalSign',
    },
  });

  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'Physician Order Update',
      message: 'Dr. Sarah Chen updated Telmisartan prescription to 80mg OD for Robert Sterling.',
      type: 'INFO',
      isRead: true,
      readAt: new Date(Date.now() - 3600000),
      entityType: 'Prescription',
    },
  });

  await prisma.notification.create({
    data: {
      userId: nurseUser1.id,
      title: 'Shift Handoff Logged',
      message: 'Morning shift handoff roster completed and signed by Ward Supervisor.',
      type: 'INFO',
      isRead: true,
      readAt: yesterday,
    },
  });

  console.log('✅ Seed completed successfully with full Doctor + Nurse dataset!');
  console.log(`- 1 Hospital created`);
  console.log(`- 2 Doctors created (Dr. Sarah Chen, Dr. Marcus Vance)`);
  console.log(`- 2 Nurses created (Nurse Sarah Jenkins: nurse.jenkins@medcore.health, Nurse David Kim: nurse.kim@medcore.health)`);
  console.log(`- 5 Patients created with 5 Nurse Assignments`);
  console.log(`- 8 Hospital Beds across 3 Wards created`);
  console.log(`- 3 Inpatient Admissions created`);
  console.log(`- 8 Doctor Appointments created`);
  console.log(`- 6 Vital Signs records created (including flagged BP)`);
  console.log(`- 4 Structured Nursing Notes created`);
  console.log(`- 10 Medication Administration tasks (Scheduled, Due, Administered, Held, Missed) created`);
  console.log(`- 5 Nurse Notifications created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
