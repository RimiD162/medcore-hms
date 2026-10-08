const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');
const patientValidators = require('../validators/patientValidators');
const patientPortalService = require('../services/patientPortalService');
const patientAuthService = require('../services/patientAuthService');
const sharedAppointmentService = require('../services/sharedAppointmentService');
const PatientPortalMapper = require('../utils/PatientPortalMapper');
const receptionistPatientService = require('../services/receptionistPatientService');
const portalConfig = require('../config/portalConfig');

// Utility to recursively check for forbidden keys in DTO responses
function checkForbiddenKeys(obj, path = '') {
  const forbiddenKeys = [
    'passwordHash',
    'password_hash',
    'codeHash',
    'code_hash',
    'doctorNotes',
    'doctor_notes',
    'internalNotes',
    'internal_notes',
    'employeeId',
    'employee_id',
    'licenseNumber',
    'license_number',
  ];

  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => checkForbiddenKeys(item, `${path}[${index}]`));
    return;
  }

  for (const key of Object.keys(obj)) {
    assert.equal(
      forbiddenKeys.includes(key),
      false,
      `Security violation: Forbidden key '${key}' detected in Patient DTO at path '${path}.${key}'`
    );
    checkForbiddenKeys(obj[key], `${path}.${key}`);
  }
}

describe('Patient Portal Module — End-to-End Test Suite', () => {

  // ─────────────────────────────────────────────────────────────
  // 1. Zod Validation & Schema Rules
  // ─────────────────────────────────────────────────────────────
  describe('1. Zod Validation Schemas', () => {
    it('should validate profile update with phone and address', () => {
      const payload = {
        phone: '+91 98765 43210',
        address: '42 Baker Street, London',
        emergencyContact: 'John Watson',
        emergencyPhone: '+91 98765 43211',
      };
      const result = patientValidators.updateProfileSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('should reject profile update attempting to modify clinical or identity fields', () => {
      const payload = {
        phone: '+91 98765 43210',
        allergies: ['None'], // Disallowed field
      };
      const result = patientValidators.updateProfileSchema.safeParse(payload);
      assert.equal(result.success, false);
    });

    it('should validate appointment booking schema with valid date and time', () => {
      const payload = {
        doctorId: '123e4567-e89b-12d3-a456-426614174000',
        appointmentDate: '2026-10-25',
        appointmentTime: '10:30',
        type: 'General',
        reason: 'Regular health checkup',
      };
      const result = patientValidators.bookAppointmentSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('should reject appointment booking with invalid date or time format', () => {
      const payload = {
        doctorId: '123e4567-e89b-12d3-a456-426614174000',
        appointmentDate: '25-10-2026', // Wrong format
        appointmentTime: '10:30:00', // Wrong format
      };
      const result = patientValidators.bookAppointmentSchema.safeParse(payload);
      assert.equal(result.success, false);
    });

    it('should validate portal invite activation schema with strong password', () => {
      const payload = {
        inviteCode: 'PORTAL-2026-INVITE-DEMO',
        email: 'patient.test@medcore.health',
        password: 'Password@123',
      };
      const result = patientValidators.activatePortalInviteSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('should reject portal invite activation with weak password', () => {
      const payload = {
        inviteCode: 'PORTAL-2026-INVITE-DEMO',
        email: 'patient.test@medcore.health',
        password: 'weak', // Too short and lacks numbers/uppercase
      };
      const result = patientValidators.activatePortalInviteSchema.safeParse(payload);
      assert.equal(result.success, false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Authentication, Invitation & Password Management
  // ─────────────────────────────────────────────────────────────
  describe('2. Patient Authentication & Account Activation', () => {
    it('should authenticate demo Patient A and return a JWT token and safe DTO', async () => {
      const loginResult = await patientAuthService.patientLogin({
        email: 'patient.a@medcore.health',
        password: 'Patient@123',
      });

      assert.ok(loginResult.token);
      assert.ok(loginResult.user);
      assert.equal(loginResult.user.email, 'patient.a@medcore.health');
      checkForbiddenKeys(loginResult.user);
    });

    it('should reject patient login with incorrect password', async () => {
      await assert.rejects(
        async () => {
          await patientAuthService.patientLogin({
            email: 'patient.a@medcore.health',
            password: 'WrongPassword@999',
          });
        },
        (err) => {
          assert.equal(err.statusCode, 401);
          return true;
        }
      );
    });

    it('should reject activating an invite with wrong email and increment attempts count', async () => {
      const invite = await prisma.portalInvite.findFirst({
        where: { inviteCode: 'PORTAL-2026-INVITE-DEMO', isRedeemed: false },
      });

      if (invite) {
        const initialAttempts = invite.attemptsCount;
        await assert.rejects(
          async () => {
            await patientAuthService.activatePortalAccount({
              inviteCode: 'PORTAL-2026-INVITE-DEMO',
              email: 'wrong.email@example.com',
              password: 'SecurePassword@123',
            });
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            return true;
          }
        );

        const updated = await prisma.portalInvite.findUnique({
          where: { id: invite.id },
        });
        assert.equal(updated.attemptsCount, initialAttempts + 1);
      }
    });

    it('should allow Front Desk receptionist to generate a new portal invite for an unlinked patient', async () => {
      const unlinkedPatient = await prisma.patient.findFirst({
        where: { userId: null, email: { not: null } },
      });

      const receptionist = await prisma.user.findFirst({
        where: { role: 'RECEPTIONIST' },
      });

      if (unlinkedPatient && receptionist) {
        const invite = await receptionistPatientService.createPortalInvite(
          unlinkedPatient.id,
          receptionist.id
        );

        assert.ok(invite.inviteCode);
        assert.equal(invite.patientId, unlinkedPatient.id);
        assert.ok(invite.inviteCode.startsWith('PORTAL-'));
      }
    });

    it('should provide honest front-desk assistance guidance for forgot-password', async () => {
      const response = await patientAuthService.forgotPassword('patient.a@medcore.health');
      assert.ok(response.message.includes('front desk'));
      assert.ok(response.supportPhone);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Patient Isolation Matrix (Patient A vs Patient B)
  // ─────────────────────────────────────────────────────────────
  describe('3. Patient Cross-Access Isolation Matrix', () => {
    let patientA, patientB;

    it('should resolve distinct Patient A and Patient B records', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
      });
      patientB = await prisma.patient.findFirst({
        where: { user: { email: 'patient.b@medcore.health' } },
      });

      assert.ok(patientA, 'Patient A record must exist');
      assert.ok(patientB, 'Patient B record must exist');
      assert.notEqual(patientA.id, patientB.id);
    });

    it('should retrieve Patient A dashboard without Patient B data leakage', async () => {
      const dashboard = await patientPortalService.getDashboard(patientA.id);
      assert.ok(dashboard.profile);
      assert.equal(dashboard.profile.id, patientA.id);
      assert.ok(dashboard.metrics);

      checkForbiddenKeys(dashboard);
    });

    it('should return 404 when Patient A attempts to access Patient B appointment by ID', async () => {
      const appointmentB = await prisma.appointment.findFirst({
        where: { patientId: patientB.id },
      });

      if (appointmentB) {
        await assert.rejects(
          async () => {
            await patientPortalService.getAppointmentById(patientA.id, appointmentB.id);
          },
          (err) => {
            assert.equal(err.statusCode, 404, 'Must return 404 Not Found on cross-patient appointment access');
            return true;
          }
        );
      }
    });

    it('should return 404 when Patient A attempts to access Patient B medical record by ID', async () => {
      const recordB = await prisma.medicalRecord.findFirst({
        where: { patientId: patientB.id },
      });

      if (recordB) {
        await assert.rejects(
          async () => {
            await patientPortalService.getMedicalRecordById(patientA.id, recordB.id);
          },
          (err) => {
            assert.equal(err.statusCode, 404, 'Must return 404 Not Found on cross-patient medical record access');
            return true;
          }
        );
      }
    });

    it('should return 404 when Patient A attempts to access Patient B lab report by ID', async () => {
      const reportB = await prisma.labReport.findFirst({
        where: { order: { patientId: patientB.id } },
      });

      if (reportB) {
        await assert.rejects(
          async () => {
            await patientPortalService.getLabReportById(patientA.id, reportB.id);
          },
          (err) => {
            assert.equal(err.statusCode, 404, 'Must return 404 Not Found on cross-patient lab report access');
            return true;
          }
        );
      }
    });

    it('should return 404 when Patient A attempts to access Patient B invoice by ID', async () => {
      const invoiceB = await prisma.invoice.findFirst({
        where: { patientId: patientB.id },
      });

      if (invoiceB) {
        await assert.rejects(
          async () => {
            await patientPortalService.getInvoiceById(patientA.id, invoiceB.id);
          },
          (err) => {
            assert.equal(err.statusCode, 404, 'Must return 404 Not Found on cross-patient invoice access');
            return true;
          }
        );
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Clinical Data Release Policy & Masking
  // ─────────────────────────────────────────────────────────────
  describe('4. Clinical Data Release Policy & Redaction', () => {
    let patientA;

    it('setup patient reference', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
      });
    });

    it('should completely hide medical records flagged with portalVisible: false', async () => {
      const hiddenRecord = await prisma.medicalRecord.findFirst({
        where: { patientId: patientA.id, portalVisible: false },
      });

      assert.ok(hiddenRecord, 'Test dataset must include a record with portalVisible: false');

      const recordsList = await patientPortalService.getMedicalRecords(patientA.id);
      const isPresentInList = recordsList.some((r) => r.id === hiddenRecord.id);
      assert.equal(isPresentInList, false, 'Hidden record must not appear in patient medical records list');

      await assert.rejects(
        async () => {
          await patientPortalService.getMedicalRecordById(patientA.id, hiddenRecord.id);
        },
        (err) => {
          assert.equal(err.statusCode, 404, 'Accessing withheld record must return 404');
          return true;
        }
      );
    });

    it('should strip doctorNotes and internal notes from released medical records', async () => {
      const visibleRecords = await patientPortalService.getMedicalRecords(patientA.id);
      for (const rec of visibleRecords) {
        assert.equal(rec.doctorNotes, undefined, 'doctorNotes must never be exposed to patient');
        assert.equal(rec.internalNotes, undefined, 'internalNotes must never be exposed to patient');
        checkForbiddenKeys(rec);
      }
    });

    it('should only return RELEASED or VERIFIED lab reports and include standard disclaimer', async () => {
      const reports = await patientPortalService.getLabReports(patientA.id);
      for (const rep of reports) {
        assert.ok(['RELEASED', 'VERIFIED'].includes(rep.status));
        assert.ok(rep.disclaimer, 'Mandatory clinical lab disclaimer must be present');
        assert.ok(rep.disclaimer.includes('Please discuss your results with your doctor'));
        checkForbiddenKeys(rep);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Appointment Booking & Scheduling Domain Rules
  // ─────────────────────────────────────────────────────────────
  describe('5. Appointment Booking & Scheduling Domain Rules', () => {
    let patientA, doctor;

    it('setup references', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
      });
      doctor = await prisma.doctorProfile.findFirst({
        include: { user: true },
      });
      assert.ok(doctor);
    });

    it('should reject appointment booking in the past', async () => {
      await assert.rejects(
        async () => {
          await sharedAppointmentService.bookAppointment({
            patientId: patientA.id,
            doctorId: doctor.id,
            appointmentDate: '2020-01-01',
            appointmentTime: '10:00',
            isPatientActor: true,
          });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.ok(err.message.includes('past date'));
          return true;
        }
      );
    });

    it('should reject booking when notice window for today is violated', async () => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const immediateH = String(now.getHours()).padStart(2, '0');
      const immediateM = String(now.getMinutes() + 5).padStart(2, '0');

      if (now.getHours() < 22) {
        await assert.rejects(
          async () => {
            await sharedAppointmentService.bookAppointment({
              patientId: patientA.id,
              doctorId: doctor.id,
              appointmentDate: todayStr,
              appointmentTime: `${immediateH}:${immediateM}`,
              isPatientActor: true,
            });
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            assert.ok(err.message.includes('advance'));
            return true;
          }
        );
      }
    });

    it('should allow querying public doctor availability', async () => {
      const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      const availability = await sharedAppointmentService.getDoctorAvailability(
        doctor.id,
        futureDate,
        true
      );

      assert.ok(availability.doctor);
      assert.equal(availability.date, futureDate);
      assert.ok(Array.isArray(availability.slots));
      checkForbiddenKeys(availability);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Document Vault Security & Ownership
  // ─────────────────────────────────────────────────────────────
  describe('6. Document Vault Security & Ownership', () => {
    let patientA, patientUserA;

    it('setup patient reference', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
        include: { user: true },
      });
      patientUserA = patientA.user;
    });

    it('should reject document upload with disallowed MIME type', async () => {
      await assert.rejects(
        async () => {
          await patientPortalService.uploadDocument(patientA.id, patientUserA.id, {
            title: 'Malicious Executable',
            category: 'Other',
            fileData: 'ZXhlY3V0YWJsZSBjb250ZW50',
            fileName: 'malware.exe',
            mimeType: 'application/x-msdownload',
          });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.ok(err.message.includes('Unsupported file type'));
          return true;
        }
      );
    });

    it('should upload a valid PDF document and allow the patient to delete it', async () => {
      const uploaded = await patientPortalService.uploadDocument(
        patientA.id,
        patientUserA.id,
        {
          title: 'Self-Uploaded Vaccination Record',
          category: 'Medical Document',
          fileData: 'JVBERi0xLjQKJcTl8uXrCg==', // Base64 minimal PDF header
          fileName: 'vaccination_card.pdf',
          mimeType: 'application/pdf',
        }
      );

      assert.ok(uploaded.id);
      assert.equal(uploaded.title, 'Self-Uploaded Vaccination Record');
      assert.equal(uploaded.isOwnUpload, true);

      // Now delete it
      const deleteResult = await patientPortalService.deleteDocument(patientA.id, uploaded.id);
      assert.ok(deleteResult.message.includes('deleted'));
    });

    it('should reject patient attempting to delete a staff-uploaded document', async () => {
      const staffDoc = await prisma.document.findFirst({
        where: { patientId: patientA.id, source: 'STAFF', deletedAt: null },
      });

      if (staffDoc) {
        await assert.rejects(
          async () => {
            await patientPortalService.deleteDocument(patientA.id, staffDoc.id);
          },
          (err) => {
            assert.equal(err.statusCode, 403, 'Patients cannot delete staff documents');
            return true;
          }
        );
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Health Timeline & Search
  // ─────────────────────────────────────────────────────────────
  describe('7. Health Timeline & Unified Search', () => {
    let patientA;

    it('setup patient reference', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
      });
    });

    it('should retrieve chronological health timeline feed', async () => {
      const timeline = await patientPortalService.getTimeline(patientA.id);
      assert.ok(Array.isArray(timeline));
      if (timeline.length > 1) {
        const d1 = new Date(timeline[0].date).getTime();
        const d2 = new Date(timeline[1].date).getTime();
        assert.ok(d1 >= d2, 'Timeline events must be sorted descending by date');
      }
      checkForbiddenKeys(timeline);
    });

    it('should perform scoped universal search across patient records', async () => {
      const searchResult = await patientPortalService.search(patientA.id, { q: 'card' });
      assert.ok(searchResult.results);
      assert.ok(Array.isArray(searchResult.results.appointments));
      assert.ok(Array.isArray(searchResult.results.prescriptions));
      checkForbiddenKeys(searchResult);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Financial Statements & Insurance (Read-Only)
  // ─────────────────────────────────────────────────────────────
  describe('8. Billing & Insurance Statements', () => {
    let patientA;

    it('setup patient reference', async () => {
      patientA = await prisma.patient.findFirst({
        where: { user: { email: 'patient.a@medcore.health' } },
      });
    });

    it('should retrieve itemized invoices with line items and payment history', async () => {
      const invoices = await patientPortalService.getInvoices(patientA.id);
      assert.ok(Array.isArray(invoices));
      for (const inv of invoices) {
        assert.ok(typeof inv.totalAmount === 'number');
        assert.ok(typeof inv.outstandingAmount === 'number');
        assert.ok(Array.isArray(inv.items));
        checkForbiddenKeys(inv);
      }
    });

    it('should retrieve insurance policies and claims without modification capability', async () => {
      const insurance = await patientPortalService.getInsurance(patientA.id);
      assert.ok(Array.isArray(insurance.policies));
      assert.ok(Array.isArray(insurance.claims));
      for (const pol of insurance.policies) {
        assert.ok(pol.provider);
        assert.ok(pol.policyNumber);
        checkForbiddenKeys(pol);
      }
    });

    it('should retrieve payment gateway configuration status', async () => {
      const invoice = await prisma.invoice.findFirst({
        where: { patientId: patientA.id },
      });

      if (invoice) {
        const options = await patientPortalService.getPaymentOptions(patientA.id, invoice.id);
        assert.equal(options.invoiceId, invoice.id);
        assert.ok(Array.isArray(options.acceptedMethods));
        assert.ok(options.currency);
      }
    });
  });
});
