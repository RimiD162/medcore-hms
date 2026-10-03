require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MedCore HMS Seed Data Generation...');

  // 1. Fast truncate of all tables in one single query
  console.log('Cleaning existing data...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
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

  const passwordHash = await bcrypt.hash('Doctor@123', 10);

  // 3. Doctor 1: Dr. Sarah Chen (Cardiology)
  const doctorUser1 = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role: 'DOCTOR',
      fullName: 'Dr. Sarah Chen',
      email: 'dr.chen@medcore.health',
      passwordHash,
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
      passwordHash,
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

  // 4. Doctor Weekly Availabilities
  const scheduleDays = [1, 2, 3, 4, 5]; // Mon - Fri
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

  // Saturday morning clinic for Dr. Chen
  await prisma.doctorAvailability.create({
    data: {
      doctorId: doctorProfile1.id,
      dayOfWeek: 6, // Sat
      startTime: '09:00',
      endTime: '13:00',
      breakStartTime: null,
      breakEndTime: null,
      consultationDuration: 15,
      isActive: true,
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
      status: 'Active',
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
      status: 'Active',
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
      status: 'Active',
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

  // Helper date calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // 6. 8 Realistic Appointments
  // Appointment 1: Today 09:30 - Robert Sterling (CONFIRMED, Checked-in "Waiting")
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
      checkedInAt: new Date(Date.now() - 25 * 60 * 1000), // checked in 25 mins ago
      reason: 'Routine BP monitoring and chest discomfort assessment',
    },
  });

  // Appointment 2: Today 10:15 - Elena Rostova (SCHEDULED)
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

  // Appointment 3: Today 11:00 - Clara Oswald (COMPLETED with consultation)
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

  // Appointment 4: Tomorrow 10:00 - David Miller (CONFIRMED)
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

  // Appointment 5: In 3 days 11:30 - Maya Patel (SCHEDULED)
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

  // Appointment 6: In 5 days 14:00 - Robert Sterling (SCHEDULED)
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

  // Appointment 7: Yesterday (COMPLETED) - Dr. Vance & Maya Patel
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

  // Appointment 8: Last Week (CANCELLED) - Elena Rostova
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

  // 7. 5 Consultations
  // Consultation 1: Draft for Apt 1 (Robert Sterling - In Progress today)
  const cons1 = await prisma.consultation.create({
    data: {
      appointmentId: apt1.id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      status: 'DRAFT',
      chiefComplaint: 'Occasional morning dizziness and mild exertion tightness',
      symptoms: ['Mild Chest Heaviness', 'Dizziness', 'Morning Fatigue'],
      vitals: {
        bp: '142/92',
        heartRate: 78,
        temp: 98.4,
        spo2: 98,
        weight: 84,
        height: 178,
        bmi: 26.5,
      },
      clinicalNotes: 'Patient notes occasional missed doses of Telmisartan on weekends. S1 and S2 heard normally, no peripheral edema. Lungs clear to auscultation.',
      diagnosis: 'Essential Hypertension (Suboptimally controlled) with Stage 1 diastolic elevation',
      treatmentPlan: 'Increase Telmisartan to 80mg OD morning. Add daily salt restriction (<2g sodium/day) and 30m brisk walking.',
      doctorNotes: 'Monitor home BP twice daily and report if systolic exceeds 150 mmHg.',
    },
  });

  // Consultation 2: Completed for Apt 3 (Clara Oswald)
  const cons2 = await prisma.consultation.create({
    data: {
      appointmentId: apt3.id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      status: 'COMPLETED',
      chiefComplaint: 'Nocturnal wheezing and breathlessness triggered by cold air',
      symptoms: ['Nocturnal Cough', 'Wheezing', 'Shortness of Breath on exertion'],
      vitals: {
        bp: '122/78',
        heartRate: 82,
        temp: 98.6,
        spo2: 97,
        weight: 62,
        height: 165,
        bmi: 22.8,
      },
      clinicalNotes: 'Bilateral expiratory wheezing noted in mid and lower zones. No cyanosis or clubbing. PEFR baseline 340 L/min.',
      diagnosis: 'Moderate Persistent Asthma with seasonal allergic exacerbation',
      treatmentPlan: 'Initiate Budesonide + Formoterol inhaler 200/6 mcg 2 puffs BD. Levocetirizine 5mg at night for 10 days.',
      doctorNotes: 'Instructed patient on correct spacer technique and peak flow meter diary.',
      completedAt: new Date(),
    },
  });

  // Consultation 3: Completed for David Miller (Past visit)
  const cons3 = await prisma.consultation.create({
    data: {
      appointmentId: apt4.id,
      doctorId: doctorProfile1.id,
      patientId: createdPatients[3].id,
      status: 'DRAFT',
      chiefComplaint: 'Routine quarterly diabetes and post-stent cardiac evaluation',
      symptoms: ['Mild bilateral foot tingling (nocturnal)', 'Occasional postprandial sluggishness'],
      vitals: {
        bp: '130/82',
        heartRate: 70,
        temp: 98.2,
        spo2: 99,
        weight: 76,
        height: 172,
        bmi: 25.7,
      },
      clinicalNotes: 'ECG regular sinus rhythm. Monofilament test shows preserved sensation in 8/10 points bilaterally.',
      diagnosis: 'Type 2 Diabetes Mellitus with early mild peripheral sensory neuropathy',
      treatmentPlan: 'Maintain Metformin 1000mg BD + Dapagliflozin 10mg OD. Add Methylcobalamin 1500mcg OD.',
      doctorNotes: 'Footwear check conducted. Advised daily warm water inspection.',
    },
  });

  // Consultation 4: Completed for Maya Patel (Yesterday - Dr. Vance)
  const cons4 = await prisma.consultation.create({
    data: {
      appointmentId: apt7.id,
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      status: 'COMPLETED',
      chiefComplaint: 'Sore throat, difficulty swallowing, fever of 101F for 2 days',
      symptoms: ['High Grade Fever', 'Throat Pain', 'Body Aches'],
      vitals: {
        bp: '118/74',
        heartRate: 90,
        temp: 100.8,
        spo2: 98,
        weight: 58,
        height: 160,
        bmi: 22.7,
      },
      clinicalNotes: 'Pharyngeal erythema with tonsillar congestion. No follicular exudates.',
      diagnosis: 'Acute Viral Pharyngitis with upper respiratory tract infection',
      treatmentPlan: 'Paracetamol 650mg TDS PRN, Warm saline gargles, Vitamin C 500mg OD for 5 days.',
      doctorNotes: 'Advised rest and hydration. Review if fever persists past 4 days.',
      completedAt: yesterday,
    },
  });

  // 8. 5 Medical Records
  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-101',
      patientId: createdPatients[0].id,
      doctorId: doctorProfile1.id,
      consultationId: cons1.id,
      recordType: 'Cardiology Review',
      title: 'Hypertension Management and Cardiovascular Risk Evaluation',
      summary: 'Patient evaluated for elevated blood pressure (142/92). Medication adjusted to Telmisartan 80mg. Lipid and renal profile ordered.',
      diagnosis: 'Essential Hypertension (Grade 2), High Cardiovascular Risk Profile',
      notes: 'Family history of premature CAD. Exercise tolerance is satisfactory.',
      vitalsSnapshot: cons1.vitals,
      recordDate: today,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-102',
      patientId: createdPatients[2].id,
      doctorId: doctorProfile1.id,
      consultationId: cons2.id,
      recordType: 'Pulmonology Review',
      title: 'Asthma Management Protocol and Inhaler Escalation',
      summary: 'Patient presented with nocturnal wheezing and cough. Spirometry reveals moderate obstructive pattern. Dual inhaler therapy initiated.',
      diagnosis: 'Moderate Persistent Bronchial Asthma',
      notes: 'Allergic to NSAIDs and Aspirin. Avoid all COX-1 inhibitors.',
      vitalsSnapshot: cons2.vitals,
      recordDate: today,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-103',
      patientId: createdPatients[3].id,
      doctorId: doctorProfile1.id,
      recordType: 'Endocrinology Review',
      title: 'Type II Diabetes & Post-PCI Stent Surveillance Record',
      summary: 'Dual antiplatelet therapy completed 1 year ago. Currently on Aspirin 75mg + Atorvastatin 40mg. Glycemic control stable.',
      diagnosis: 'Type 2 Diabetes Mellitus, CAD Status Post-LAD Stenting (2024)',
      notes: 'Regular exercise routine maintained. Renal parameters within normal limits.',
      vitalsSnapshot: { bp: '130/82', heartRate: 70, temp: 98.2, spo2: 99 },
      recordDate: lastWeek,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-104',
      patientId: createdPatients[1].id,
      doctorId: doctorProfile1.id,
      recordType: 'Surgical Follow-up',
      title: 'Post-Appendectomy 2-Week Surgical Wound Review',
      summary: 'Laparoscopic appendectomy performed 2 weeks ago. Ports are clean, dry, and healing by primary intention. No signs of infection.',
      diagnosis: 'Post-Laparoscopic Appendectomy Status (Normal Recovery)',
      notes: 'Normal diet resumed. Permitted light aerobic exercises.',
      vitalsSnapshot: { bp: '116/76', heartRate: 72, temp: 98.4, spo2: 99 },
      recordDate: yesterday,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      recordNumber: 'REC-2026-105',
      patientId: createdPatients[4].id,
      doctorId: doctorProfile2.id,
      consultationId: cons4.id,
      recordType: 'General OPD',
      title: 'Acute Pharyngitis & Upper Respiratory Infection Record',
      summary: 'Patient treated conservatively with antipyretics and symptomatic relief. Throat swabs negative for streptococcal infection.',
      diagnosis: 'Acute Viral Pharyngitis',
      notes: 'Follow-up scheduled in 1 week if symptoms do not resolve.',
      vitalsSnapshot: cons4.vitals,
      recordDate: yesterday,
    },
  });

  // 9. 5 Prescriptions with PrescriptionItems
  // Prescription 1: For Robert Sterling
  const rx1 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-101',
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      consultationId: cons1.id,
      status: 'Active',
      notes: 'Take medicines regularly after breakfast. Avoid excessive sodium intake.',
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
  });

  // Prescription 2: For Clara Oswald
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
          {
            medicineName: 'Salbutamol 100mcg SOS Inhaler',
            dosage: '100mcg',
            frequency: '1-2 Puffs SOS as needed for acute shortness of breath',
            duration: 'As Needed',
            route: 'Inhalation',
            instructions: 'Emergency rescue inhaler only',
          },
        ],
      },
    },
  });

  // Prescription 3: For David Miller
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
            medicineName: 'Metformin Hydrochloride 1000mg Extended Release',
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
          {
            medicineName: 'Methylcobalamin 1500mcg + Alpha Lipoic Acid',
            dosage: '1500mcg',
            frequency: '1-0-0 (Once Daily)',
            duration: '30 Days',
            route: 'Oral',
            instructions: 'For diabetic peripheral nerve support',
          },
        ],
      },
    },
  });

  // Prescription 4: For Elena Rostova
  await prisma.prescription.create({
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
            medicineName: 'Paracetamol 650mg Tablet',
            dosage: '650mg',
            frequency: '1-0-1 (Twice Daily as needed)',
            duration: '5 Days',
            route: 'Oral',
            instructions: 'Take after meals for mild pain relief',
          },
          {
            medicineName: 'Pantoprazole 40mg Tablet',
            dosage: '40mg',
            frequency: '1-0-0 (Once Daily Morning)',
            duration: '10 Days',
            route: 'Oral',
            instructions: 'Take 30 minutes before breakfast',
          },
        ],
      },
    },
  });

  // Prescription 5: For Maya Patel
  await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-2026-105',
      doctorId: doctorProfile2.id,
      patientId: createdPatients[4].id,
      consultationId: cons4.id,
      status: 'Active',
      notes: 'Complete full course of supportive therapy.',
      prescribedDate: yesterday,
      items: {
        create: [
          {
            medicineName: 'Levothyroxine Sodium 75mcg Tablet',
            dosage: '75mcg',
            frequency: '1-0-0 (Once Daily Empty Stomach)',
            duration: '90 Days',
            route: 'Oral',
            instructions: 'Take early morning on empty stomach with plain water',
          },
          {
            medicineName: 'Vitamin D3 60,000 IU Capsule',
            dosage: '60,000 IU',
            frequency: 'Once Weekly (Every Sunday)',
            duration: '8 Weeks',
            route: 'Oral',
            instructions: 'Take with milk after breakfast',
          },
        ],
      },
    },
  });

  // 10. 5 Lab Reports with mixed statuses
  await prisma.labReport.create({
    data: {
      reportNumber: 'LAB-2026-501',
      patientId: createdPatients[0].id,
      orderedById: doctorProfile1.id,
      testName: 'Complete Lipid Profile & Serum Creatinine',
      category: 'Clinical Biochemistry',
      status: 'COMPLETED',
      orderedDate: yesterday,
      resultDate: today,
      resultSummary: 'Total Cholesterol: 218 mg/dL (High), LDL: 138 mg/dL (High), HDL: 44 mg/dL, Triglycerides: 178 mg/dL, Creatinine: 0.98 mg/dL (Normal).',
      referenceRange: 'Total Chol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL, Creatinine: 0.7 - 1.2 mg/dL',
      documentReference: 'DOC-LAB-501.pdf',
      doctorNotes: 'Suboptimal LDL response. Up-titrated statin dosage.',
      isReviewed: true,
      reviewedAt: today,
    },
  });

  await prisma.labReport.create({
    data: {
      reportNumber: 'LAB-2026-502',
      patientId: createdPatients[3].id,
      orderedById: doctorProfile1.id,
      testName: 'Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose',
      category: 'Clinical Biochemistry',
      status: 'COMPLETED',
      orderedDate: new Date(Date.now() - 3 * 86400000),
      resultDate: yesterday,
      resultSummary: 'HbA1c: 6.8% (Good Glycemic Control), Fasting Blood Sugar: 114 mg/dL, Postprandial: 148 mg/dL.',
      referenceRange: 'HbA1c: < 7.0% (Diabetic Goal), FBS: 70 - 100 mg/dL',
      documentReference: 'DOC-LAB-502.pdf',
      doctorNotes: 'Excellent progress. Keep current Metformin + SGLT2i regimen.',
      isReviewed: true,
      reviewedAt: yesterday,
    },
  });

  await prisma.labReport.create({
    data: {
      reportNumber: 'LAB-2026-503',
      patientId: createdPatients[2].id,
      orderedById: doctorProfile1.id,
      testName: 'Spirometry & Fractional Exhaled Nitric Oxide (FeNO)',
      category: 'Pulmonary Function Lab',
      status: 'PROCESSING',
      orderedDate: today,
      resultDate: null,
      resultSummary: 'Specimen under analysis in Pulmonary Function Lab.',
      referenceRange: 'FeNO: < 25 ppb (Normal), FEV1/FVC: > 0.75',
      documentReference: null,
      doctorNotes: null,
      isReviewed: false,
    },
  });

  await prisma.labReport.create({
    data: {
      reportNumber: 'LAB-2026-504',
      patientId: createdPatients[4].id,
      orderedById: doctorProfile1.id,
      testName: 'High-Sensitivity Thyroid Stimulating Hormone (TSH) & Free T4',
      category: 'Endocrinology & Immunology',
      status: 'ORDERED',
      orderedDate: today,
      resultDate: null,
      resultSummary: 'Sample collection token generated #TK-744. Awaiting phlebotomy.',
      referenceRange: 'TSH: 0.45 - 4.50 mIU/L, FT4: 0.82 - 1.77 ng/dL',
      documentReference: null,
      doctorNotes: null,
      isReviewed: false,
    },
  });

  await prisma.labReport.create({
    data: {
      reportNumber: 'LAB-2026-505',
      patientId: createdPatients[1].id,
      orderedById: doctorProfile1.id,
      testName: 'Complete Blood Count (CBC) with Differential & ESR',
      category: 'Hematology',
      status: 'COMPLETED',
      orderedDate: lastWeek,
      resultDate: lastWeek,
      resultSummary: 'Hemoglobin: 13.2 g/dL, WBC: 7,400 /uL, Platelets: 240,000 /uL, ESR: 12 mm/hr (Normal post-op baseline).',
      referenceRange: 'Hb: 12.0 - 15.5 g/dL, WBC: 4,000 - 11,000 /uL',
      documentReference: 'DOC-LAB-505.pdf',
      doctorNotes: 'WBC count normalised following surgical recovery.',
      isReviewed: true,
      reviewedAt: lastWeek,
    },
  });

  // 11. Documents
  await prisma.document.create({
    data: {
      patientId: createdPatients[0].id,
      title: 'Lipid Profile & Serum Creatinine Lab Report',
      category: 'Lab Reports',
      fileUrl: '/documents/lab_reports/LAB-2026-501.pdf',
      fileSize: '342 KB',
      mimeType: 'application/pdf',
      prescriptionId: rx1.id,
    },
  });

  await prisma.document.create({
    data: {
      patientId: createdPatients[2].id,
      title: 'Asthma Treatment Protocol Prescription RX-2026-102',
      category: 'Prescriptions',
      fileUrl: '/documents/prescriptions/RX-2026-102.pdf',
      fileSize: '184 KB',
      mimeType: 'application/pdf',
      prescriptionId: rx2.id,
    },
  });

  await prisma.document.create({
    data: {
      patientId: createdPatients[3].id,
      title: 'HbA1c Quarterly Diagnostic Report',
      category: 'Lab Reports',
      fileUrl: '/documents/lab_reports/LAB-2026-502.pdf',
      fileSize: '298 KB',
      mimeType: 'application/pdf',
    },
  });

  await prisma.document.create({
    data: {
      patientId: createdPatients[1].id,
      title: 'Laparoscopic Appendectomy Discharge Summary & Operative Note',
      category: 'Medical Documents',
      fileUrl: '/documents/records/SURG-APP-2026.pdf',
      fileSize: '512 KB',
      mimeType: 'application/pdf',
    },
  });

  await prisma.document.create({
    data: {
      patientId: createdPatients[0].id,
      title: 'Resting 12-Lead Electrocardiogram (ECG) Tracing',
      category: 'Consultation Documents',
      fileUrl: '/documents/cardio/ECG-STERLING-2026.pdf',
      fileSize: '890 KB',
      mimeType: 'application/pdf',
    },
  });

  // 12. Follow-ups
  await prisma.followUp.create({
    data: {
      doctorId: doctorProfile1.id,
      patientId: createdPatients[0].id,
      followUpDate: inFiveDays,
      reason: 'Post-medication blood pressure titration review',
      notes: 'Check home BP log and review new Telmisartan 80mg tolerance.',
      status: 'Pending',
    },
  });

  await prisma.followUp.create({
    data: {
      doctorId: doctorProfile1.id,
      patientId: createdPatients[2].id,
      followUpDate: inThreeDays,
      reason: 'Spirometry and FeNO lab report review',
      notes: 'Assess peak flow diary after starting dual inhaler therapy.',
      status: 'Pending',
    },
  });

  await prisma.followUp.create({
    data: {
      doctorId: doctorProfile1.id,
      patientId: createdPatients[3].id,
      followUpDate: tomorrow,
      reason: 'Quarterly comprehensive diabetic review',
      notes: 'Assess diabetic foot sensitivity and check lipid targets.',
      status: 'Pending',
    },
  });

  // 13. Notifications for Doctor
  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'Patient Checked In',
      message: 'Robert Sterling (MED-P-1001) has checked in for 09:30 AM consultation and is waiting in OPD-102 queue.',
      type: 'APPOINTMENT',
      isRead: false,
      entityType: 'Appointment',
      entityId: apt1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'Critical Lab Alert Reviewed',
      message: 'Lipid Profile results for Robert Sterling are ready for clinical interpretation (Cholesterol: 218 mg/dL).',
      type: 'LAB_RESULT',
      isRead: false,
      entityType: 'LabReport',
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'New Appointment Scheduled',
      message: 'Maya Patel (MED-P-1005) has booked an OPD appointment for Thyroid evaluation on Oct 6, 11:30 AM.',
      type: 'APPOINTMENT',
      isRead: true,
      readAt: new Date(Date.now() - 3600000),
      entityType: 'Appointment',
      entityId: apt5.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'Upcoming Clinical Follow-up',
      message: 'David Miller (MED-P-1004) is scheduled for diabetes quarterly review tomorrow at 10:00 AM.',
      type: 'INFO',
      isRead: false,
      entityType: 'FollowUp',
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctorUser1.id,
      title: 'Department Notice',
      message: 'Weekly Hospital Clinical Grand Rounds scheduled this Thursday at 4:00 PM in Auditorium A.',
      type: 'INFO',
      isRead: true,
      readAt: yesterday,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`- 1 Hospital created`);
  console.log(`- 2 Doctors created (Dr. Sarah Chen: dr.chen@medcore.health, Dr. Marcus Vance: dr.vance@medcore.health)`);
  console.log(`- 5 Patients created`);
  console.log(`- 8 Appointments created (Today: 3, Upcoming: 3, Past: 2)`);
  console.log(`- 5 Consultations created`);
  console.log(`- 5 Medical Records created`);
  console.log(`- 5 Prescriptions created`);
  console.log(`- 5 Lab Reports created`);
  console.log(`- 5 Documents created`);
  console.log(`- 3 Follow-ups created`);
  console.log(`- 5 Notifications created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
