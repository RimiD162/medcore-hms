const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');
const receptionistValidators = require('../validators/receptionistValidators');
const receptionistPatientService = require('../services/receptionistPatientService');
const receptionistAppointmentService = require('../services/receptionistAppointmentService');
const receptionistBillingService = require('../services/receptionistBillingService');
const receptionistEmergencyService = require('../services/receptionistEmergencyService');
const receptionistDashboardService = require('../services/receptionistDashboardService');

describe('Receptionist Module — Core Features & Business Rules', () => {

  describe('1. Zod Validation Schemas', () => {
    it('should validate complete patient registration payload', () => {
      const validPatient = {
        fullName: 'Alexander Hamilton',
        dateOfBirth: '1985-01-11',
        gender: 'Male',
        phone: '+91 99887 76655',
        email: 'alex.hamilton@example.com',
        bloodGroup: 'A+',
        address: '10 Wall Street, Metro City',
        emergencyContact: 'Elizabeth Hamilton',
        emergencyPhone: '+91 99887 76656',
        allergies: ['Penicillin'],
        chronicConditions: ['Hypertension'],
      };

      const result = receptionistValidators.registerPatientSchema.safeParse(validPatient);
      assert.equal(result.success, true);
    });

    it('should reject patient registration with invalid gender or short name', () => {
      const invalidPatient = {
        fullName: 'A',
        dateOfBirth: '1985-01-11',
        gender: 'Alien',
        phone: '123',
      };

      const result = receptionistValidators.registerPatientSchema.safeParse(invalidPatient);
      assert.equal(result.success, false);
    });

    it('should validate appointment booking schema', () => {
      const validBooking = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        doctorId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentDate: '2026-10-15',
        appointmentTime: '10:30',
        type: 'General',
        reason: 'Follow-up for blood pressure check',
      };

      const result = receptionistValidators.bookAppointmentSchema.safeParse(validBooking);
      assert.equal(result.success, true);
    });

    it('should require minimum 3 characters for cancellation reason', () => {
      const invalidCancel = { cancelReason: 'No' };
      assert.equal(receptionistValidators.cancelAppointmentSchema.safeParse(invalidCancel).success, false);

      const validCancel = { cancelReason: 'Patient feeling unwell and requested postponement' };
      assert.equal(receptionistValidators.cancelAppointmentSchema.safeParse(validCancel).success, true);
    });

    it('should reject payment recording with zero or negative amount', () => {
      const zeroPayment = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        patientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 0,
        paymentMethod: 'CASH',
      };
      assert.equal(receptionistValidators.recordPaymentSchema.safeParse(zeroPayment).success, false);

      const negPayment = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        patientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -100,
        paymentMethod: 'CARD',
      };
      assert.equal(receptionistValidators.recordPaymentSchema.safeParse(negPayment).success, false);
    });

    it('should enforce role immutability in receptionist profile update schema', () => {
      const maliciousUpdate = {
        phone: '+91 99999 88888',
        role: 'ADMIN',
        permissions: ['ALL'],
      };

      const result = receptionistValidators.updateReceptionistProfileSchema.safeParse(maliciousUpdate);
      assert.equal(result.success, false);
    });
  });

  describe('2. Patient Registration & Receptionist-Safe Projections', () => {
    it('should detect duplicate patient when matching phone exists', async () => {
      const duplicates = await receptionistPatientService.checkDuplicates('+91 98450 11223', 'Different Name', '1990-01-01');
      assert.ok(duplicates.length > 0);
      assert.equal(duplicates[0].phone, '+91 98450 11223');
    });

    it('should register a new patient and generate unique MC-YYYY-NNNNNN identifier', async () => {
      const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const testPhone = `+91 999${Math.floor(100000 + Math.random() * 900000)}`;
      const result = await receptionistPatientService.registerPatient({
        fullName: `Eleanor Vance ${uniqueSuffix}`,
        dateOfBirth: '1994-06-15',
        gender: 'Female',
        phone: testPhone,
        email: `eleanor.${uniqueSuffix}@example.com`,
        bloodGroup: 'O+',
        allergies: ['Dust'],
      });

      assert.equal(result.duplicateWarning, false);
      assert.ok(result.patient);
      assert.match(result.patient.patientIdNumber, /^MC-\d{4}-\d{6}$/);
      assert.equal(result.patient.fullName, `Eleanor Vance ${uniqueSuffix}`);
    });

    it('should return safe projection for patient details without leaking clinical records', async () => {
      const patient = await prisma.patient.findFirst({
        where: { fullName: 'Robert Sterling' },
      });
      assert.ok(patient);

      const safeProfile = await receptionistPatientService.getPatientById(patient.id);
      
      // Demographics & contact present
      assert.equal(safeProfile.fullName, 'Robert Sterling');
      assert.equal(safeProfile.phone, '+91 98450 11223');
      assert.ok(Array.isArray(safeProfile.appointments));
      assert.ok(Array.isArray(safeProfile.invoices));
      assert.ok(Array.isArray(safeProfile.payments));

      // Strictly NO clinical fields
      assert.equal(safeProfile.clinicalNotes, undefined);
      assert.equal(safeProfile.diagnosis, undefined);
      assert.equal(safeProfile.prescriptions, undefined);
      assert.equal(safeProfile.labReports, undefined);
      assert.equal(safeProfile.vitals, undefined);
    });
  });

  describe('3. Availability Engine & Booking Concurrency Guard', () => {
    it('should generate available time slots from doctor schedule', async () => {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { department: { contains: 'Cardiology' } },
      });
      assert.ok(doctor);

      // Mon next week
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
      const dateStr = targetDate.toISOString().slice(0, 10);

      const availability = await receptionistAppointmentService.getDoctorAvailability(doctor.id, dateStr);

      assert.equal(availability.isOffDuty, false);
      assert.ok(Array.isArray(availability.slots));
      assert.ok(availability.slots.length > 0);
      assert.ok(availability.slots.some(s => s.status === 'Available'));
    });

    it('should book an appointment and verify duplicate booking collision fails cleanly', async () => {
      const doctor = await prisma.doctorProfile.findFirst();
      const patient = await prisma.patient.findFirst();
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 90 + Math.floor(Math.random() * 50));
      const dateStr = targetDate.toISOString().slice(0, 10);
      const testTime = `15:${String(Math.floor(10 + Math.random() * 40)).padStart(2, '0')}`;

      // 1. First booking succeeds
      const booking1 = await receptionistAppointmentService.bookAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: dateStr,
        appointmentTime: testTime,
        type: 'General',
        reason: 'First booking test',
      }, receptionist.id);

      assert.ok(booking1.id);
      assert.equal(booking1.appointmentTime, testTime);

      // 2. Second booking for the EXACT same slot must be rejected with conflict error
      await assert.rejects(
        async () => {
          await receptionistAppointmentService.bookAppointment({
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentDate: dateStr,
            appointmentTime: testTime,
            type: 'Routine',
            reason: 'Simultaneous collision test',
          }, receptionist.id);
        },
        /already been booked/
      );
    });

    it('should enforce check-in rules: only permitted on appointment date', async () => {
      const doctor = await prisma.doctorProfile.findFirst();
      const patient = await prisma.patient.findFirst();
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateStr = futureDate.toISOString().slice(0, 10);

      const futureApt = await receptionistAppointmentService.bookAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: dateStr,
        appointmentTime: `16:${String(Math.floor(10 + Math.random() * 40)).padStart(2, '0')}`,
        type: 'Consultation',
        reason: 'Future check-in validation test',
      }, receptionist.id);

      await assert.rejects(
        async () => {
          await receptionistAppointmentService.checkInAppointment(futureApt.id);
        },
        /only permitted on the day of the appointment/
      );
    });

    it('should successfully check in a today appointment and transition to CONFIRMED with Waiting state', async () => {
      const doctor = await prisma.doctorProfile.findFirst();
      const patient = await prisma.patient.findFirst();
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });

      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const todayApt = await receptionistAppointmentService.bookAppointment({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: todayStr,
        appointmentTime: `17:${String(Math.floor(10 + Math.random() * 40)).padStart(2, '0')}`,
        type: 'Checkup',
        reason: 'Today check-in test',
      }, receptionist.id);

      const checkedIn = await receptionistAppointmentService.checkInAppointment(todayApt.id);
      assert.equal(checkedIn.isCheckedIn, true);
      assert.equal(checkedIn.status, 'CONFIRMED');
      assert.ok(checkedIn.checkedInAt);
    });
  });

  describe('4. Server-Authoritative Billing & Payment Integrity', () => {
    it('should calculate invoice totals from ServiceCatalog rates and ignore client calculations', async () => {
      const patient = await prisma.patient.findFirst();
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });
      const cbcService = await prisma.serviceCatalog.findFirst({ where: { code: 'SRV-LAB-CBC' } });

      assert.ok(cbcService);

      const invoice = await receptionistBillingService.createInvoice({
        patientId: patient.id,
        items: [
          {
            serviceCatalogId: cbcService.id,
            serviceName: cbcService.name,
            quantity: 2, // 250 * 2 = 500
          },
        ],
      }, receptionist.id);

      assert.equal(Number(invoice.subtotal), 500.00);
      assert.equal(Number(invoice.totalAmount), 500.00);
      assert.equal(Number(invoice.outstandingAmount), 500.00);
      assert.equal(Number(invoice.paidAmount), 0.00);
      assert.equal(invoice.status, 'PENDING');
    });

    it('should reject payment exceeding outstanding invoice balance (overpayment guard)', async () => {
      const invoice = await prisma.invoice.findFirst({
        where: { status: 'PENDING' },
      });
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });

      assert.ok(invoice);
      const outstanding = Number(invoice.outstandingAmount);

      await assert.rejects(
        async () => {
          await receptionistBillingService.recordPayment({
            invoiceId: invoice.id,
            patientId: invoice.patientId,
            amount: outstanding + 500, // Overpayment
            paymentMethod: 'CASH',
          }, receptionist.id);
        },
        /exceeds remaining outstanding balance/
      );
    });

    it('should record partial and full payments transitioning status from PENDING -> PARTIALLY_PAID -> PAID', async () => {
      const patient = await prisma.patient.findFirst();
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });
      const xrayService = await prisma.serviceCatalog.findFirst({ where: { code: 'SRV-RAD-XRAY' } });

      // Create $400 invoice
      const invoice = await receptionistBillingService.createInvoice({
        patientId: patient.id,
        items: [
          {
            serviceCatalogId: xrayService.id,
            serviceName: xrayService.name,
            quantity: 1,
          },
        ],
      }, receptionist.id);

      assert.equal(Number(invoice.totalAmount), 400.00);

      // Step 1: Record partial payment of $150
      const partialRes = await receptionistBillingService.recordPayment({
        invoiceId: invoice.id,
        patientId: patient.id,
        amount: 150.00,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-PARTIAL-TEST',
      }, receptionist.id);

      assert.equal(Number(partialRes.invoice.paidAmount), 150.00);
      assert.equal(Number(partialRes.invoice.outstandingAmount), 250.00);
      assert.equal(partialRes.invoice.status, 'PARTIALLY_PAID');

      // Step 2: Record remaining payment of $250
      const finalRes = await receptionistBillingService.recordPayment({
        invoiceId: invoice.id,
        patientId: patient.id,
        amount: 250.00,
        paymentMethod: 'CASH',
        referenceNumber: 'CASH-FINAL-TEST',
      }, receptionist.id);

      assert.equal(Number(finalRes.invoice.paidAmount), 400.00);
      assert.equal(Number(finalRes.invoice.outstandingAmount), 0.00);
      assert.equal(finalRes.invoice.status, 'PAID');
    });
  });

  describe('5. Fast-Path Emergency Intake', () => {
    it('should register emergency patient with minimal required fields and generate EMG identifier', async () => {
      const receptionist = await prisma.user.findFirst({ where: { role: 'RECEPTIONIST' } });

      const emergency = await receptionistEmergencyService.createEmergency({
        patientName: 'Unidentified Male (Trauma Bay 2)',
        priority: 'CRITICAL',
        reason: 'Motor vehicle accident with head injury and acute hemorrhage',
        gender: 'Male',
        age: 35,
      }, receptionist.id);

      assert.ok(emergency.id);
      assert.match(emergency.emergencyNumber, /^EMG-\d{4}-\d{3}$/);
      assert.equal(emergency.priority, 'CRITICAL');
      assert.equal(emergency.status, 'TRIAGED');
      assert.ok(emergency.patient);
      assert.equal(emergency.patient.registrationSource, 'Emergency');
    });
  });

  describe('6. Dashboard Front Desk Metrics', () => {
    it('should retrieve front desk summary metrics and lobby queue', async () => {
      const summary = await receptionistDashboardService.getDashboardSummary();

      assert.ok(summary.stats);
      assert.equal(typeof summary.stats.todayRegistrations, 'number');
      assert.equal(typeof summary.stats.todayAppointments, 'number');
      assert.equal(typeof summary.stats.waitingPatients, 'number');
      assert.equal(typeof summary.stats.todayCollections, 'number');
      assert.ok(Array.isArray(summary.todayAppointments));
      assert.ok(Array.isArray(summary.waitingPatients));
      assert.ok(Array.isArray(summary.recentRegistrations));
    });
  });
});
