const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const portalConfig = require('../config/portalConfig');
const PatientPortalMapper = require('../utils/PatientPortalMapper');
const sharedAppointmentService = require('./sharedAppointmentService');
const paymentGatewayService = require('./paymentGatewayService');
const patientNotificationService = require('./patientNotificationService');

class PatientPortalService {
  /**
   * 1. Patient Portal Dashboard
   */
  async getDashboard(patientId) {
    if (!patientId) throw ApiError.unauthorized('Patient context required');

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) throw ApiError.notFound('Patient record not found');

    const now = new Date();
    const todayDate = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z');

    // Run parallel metrics queries
    const [
      upcomingAppointments,
      recentPrescriptions,
      releasedLabReports,
      pendingInvoices,
      recentInvoices,
      recentRecords,
      unreadNotificationsCount,
    ] = await Promise.all([
      // Upcoming Appointments
      prisma.appointment.findMany({
        where: {
          patientId,
          appointmentDate: { gte: todayDate },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          doctor: { include: { user: true } },
        },
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        take: 5,
      }),

      // Active / Recent Prescriptions
      prisma.prescription.findMany({
        where: {
          patientId,
          status: 'Active',
        },
        include: {
          doctor: { include: { user: true } },
          items: true,
          consultation: true,
        },
        orderBy: { prescribedDate: 'desc' },
        take: 3,
      }),

      // Released Diagnostic Lab Reports
      prisma.labReport.findMany({
        where: {
          order: { patientId },
          status: { in: ['RELEASED', 'VERIFIED'] },
        },
        include: {
          order: {
            include: {
              items: { include: { labTest: true } },
              orderingDoctor: { include: { user: true } },
            },
          },
        },
        orderBy: { releasedAt: 'desc' },
        take: 3,
      }),

      // Pending / Unpaid Invoices
      prisma.invoice.findMany({
        where: {
          patientId,
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        include: {
          items: true,
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
      }),

      // Recent Invoices (up to 3)
      prisma.invoice.findMany({
        where: { patientId },
        include: { items: true, payments: true },
        orderBy: { invoiceDate: 'desc' },
        take: 3,
      }),

      // Completed Portal-Visible Medical Records
      prisma.medicalRecord.findMany({
        where: {
          patientId,
          portalVisible: true,
          consultation: { status: 'COMPLETED' },
        },
        include: {
          doctor: { include: { user: true } },
          consultation: true,
          documents: true,
        },
        orderBy: { recordDate: 'desc' },
        take: 3,
      }),

      // Unread Notifications Count
      patient.userId
        ? prisma.notification.count({
            where: { userId: patient.userId, isRead: false },
          })
        : 0,
    ]);

    // Calculate total outstanding amount
    const totalOutstanding = pendingInvoices.reduce(
      (sum, inv) => sum + Number(inv.outstandingAmount || 0),
      0
    );

    return {
      profile: PatientPortalMapper.toPatientProfileDTO(patient, patient.user),
      metrics: {
        upcomingAppointmentsCount: upcomingAppointments.length,
        activePrescriptionsCount: recentPrescriptions.length,
        releasedLabReportsCount: releasedLabReports.length,
        unpaidInvoicesCount: pendingInvoices.length,
        totalOutstandingAmount: totalOutstanding,
        unreadNotificationsCount,
      },
      nextAppointment: upcomingAppointments.length > 0
        ? PatientPortalMapper.toPatientAppointmentDTO(upcomingAppointments[0])
        : null,
      upcomingAppointments: upcomingAppointments.map((a) =>
        PatientPortalMapper.toPatientAppointmentDTO(a)
      ),
      recentPrescriptions: recentPrescriptions.map((p) =>
        PatientPortalMapper.toPatientPrescriptionDTO(p)
      ),
      recentLabReports: releasedLabReports.map((r) =>
        PatientPortalMapper.toPatientLabReportDTO(r)
      ),
      recentMedicalRecords: recentRecords.map((r) =>
        PatientPortalMapper.toPatientMedicalRecordDTO(r)
      ),
      recentInvoices: recentInvoices.map((i) =>
        PatientPortalMapper.toPatientInvoiceDTO(i)
      ),
    };
  }

  /**
   * 2. Get Patient Profile
   */
  async getProfile(patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) throw ApiError.notFound('Patient profile not found');
    return PatientPortalMapper.toPatientProfileDTO(patient, patient.user);
  }

  /**
   * 3. Update Patient Profile (Phone, Address, Emergency Contact only)
   */
  async updateProfile(patientId, data) {
    const existing = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!existing) throw ApiError.notFound('Patient profile not found');

    const updateData = {};
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.emergencyPhone !== undefined) updateData.emergencyPhone = data.emergencyPhone;

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
      include: { user: true },
    });

    return PatientPortalMapper.toPatientProfileDTO(updated, updated.user);
  }

  /**
   * 4. Appointments List
   */
  async getAppointments(patientId, query = {}) {
    const { status, timeframe } = query;
    const where = { patientId };

    if (status) {
      where.status = status;
    }

    const todayDate = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

    if (timeframe === 'upcoming') {
      where.appointmentDate = { gte: todayDate };
      where.status = { in: ['SCHEDULED', 'CONFIRMED'] };
    } else if (timeframe === 'past') {
      where.OR = [
        { appointmentDate: { lt: todayDate } },
        { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
      },
      orderBy: [
        { appointmentDate: timeframe === 'upcoming' ? 'asc' : 'desc' },
        { appointmentTime: timeframe === 'upcoming' ? 'asc' : 'desc' },
      ],
    });

    return appointments.map((a) => PatientPortalMapper.toPatientAppointmentDTO(a));
  }

  /**
   * 5. Appointment Detail (Strict Isolation)
   */
  async getAppointmentById(patientId, appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
      },
      include: {
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    return PatientPortalMapper.toPatientAppointmentDTO(appointment);
  }

  /**
   * 6. List Doctors (Public safe projection)
   */
  async getDoctors(query = {}) {
    const { department, search } = query;
    const where = {
      status: 'Available',
    };

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { department: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: { user: true },
      orderBy: { user: { fullName: 'asc' } },
    });

    return doctors.map((d) => PatientPortalMapper.toPublicDoctorDTO(d));
  }

  /**
   * 7. Doctor Availability (Public & Patient Safe)
   */
  async getDoctorAvailability(doctorId, date) {
    return sharedAppointmentService.getDoctorAvailability(doctorId, date, true);
  }

  /**
   * 8. Book Appointment
   */
  async bookAppointment(patientId, data) {
    const result = await sharedAppointmentService.bookAppointment({
      patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      type: data.type || 'General',
      reason: data.reason || null,
      isPatientActor: true,
    });

    return PatientPortalMapper.toPatientAppointmentDTO(result);
  }

  /**
   * 9. Reschedule Appointment
   */
  async rescheduleAppointment(patientId, appointmentId, data) {
    const result = await sharedAppointmentService.rescheduleAppointment({
      appointmentId,
      newDate: data.appointmentDate,
      newTime: data.appointmentTime,
      isPatientActor: true,
      patientId,
    });

    return PatientPortalMapper.toPatientAppointmentDTO(result);
  }

  /**
   * 10. Cancel Appointment
   */
  async cancelAppointment(patientId, appointmentId, data) {
    const result = await sharedAppointmentService.cancelAppointment({
      appointmentId,
      cancelReason: data.cancelReason,
      isPatientActor: true,
      patientId,
    });

    return PatientPortalMapper.toPatientAppointmentDTO(result);
  }

  /**
   * 11. Medical Records List (Strict: portalVisible = true, Completed consultations only)
   */
  async getMedicalRecords(patientId, query = {}) {
    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        portalVisible: true,
        consultation: {
          status: 'COMPLETED',
        },
      },
      include: {
        doctor: { include: { user: true } },
        consultation: true,
        documents: {
          where: { patientVisible: true, deletedAt: null },
        },
      },
      orderBy: { recordDate: 'desc' },
    });

    return records.map((r) => PatientPortalMapper.toPatientMedicalRecordDTO(r));
  }

  /**
   * 12. Medical Record Detail (Strict Isolation & Policy)
   */
  async getMedicalRecordById(patientId, recordId) {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patientId,
        portalVisible: true,
        consultation: {
          status: 'COMPLETED',
        },
      },
      include: {
        doctor: { include: { user: true } },
        consultation: true,
        documents: {
          where: { patientVisible: true, deletedAt: null },
        },
      },
    });

    if (!record) {
      throw ApiError.notFound('Medical record not found');
    }

    return PatientPortalMapper.toPatientMedicalRecordDTO(record);
  }

  /**
   * 13. Prescriptions List
   */
  async getPrescriptions(patientId, query = {}) {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true } },
        items: true,
        consultation: true,
      },
      orderBy: { prescribedDate: 'desc' },
    });

    return prescriptions.map((p) => PatientPortalMapper.toPatientPrescriptionDTO(p));
  }

  /**
   * 14. Prescription Detail
   */
  async getPrescriptionById(patientId, prescriptionId) {
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        patientId,
      },
      include: {
        doctor: { include: { user: true } },
        items: true,
        consultation: true,
      },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found');
    }

    return PatientPortalMapper.toPatientPrescriptionDTO(prescription);
  }

  /**
   * 15. Released Lab Reports List
   */
  async getLabReports(patientId, query = {}) {
    const reports = await prisma.labReport.findMany({
      where: {
        order: { patientId },
        status: { in: ['RELEASED', 'VERIFIED'] },
      },
      include: {
        order: {
          include: {
            items: { include: { labTest: true } },
            orderingDoctor: { include: { user: true } },
          },
        },
      },
      orderBy: { releasedAt: 'desc' },
    });

    return reports.map((r) => PatientPortalMapper.toPatientLabReportDTO(r));
  }

  /**
   * 16. Released Lab Report Detail
   */
  async getLabReportById(patientId, reportId) {
    const report = await prisma.labReport.findFirst({
      where: {
        id: reportId,
        order: { patientId },
        status: { in: ['RELEASED', 'VERIFIED'] },
      },
      include: {
        order: {
          include: {
            items: { include: { labTest: true } },
            orderingDoctor: { include: { user: true } },
          },
        },
      },
    });

    if (!report) {
      throw ApiError.notFound('Laboratory report not found');
    }

    return PatientPortalMapper.toPatientLabReportDTO(report);
  }

  /**
   * 17. Invoices List
   */
  async getInvoices(patientId, query = {}) {
    const { status } = query;
    const where = { patientId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map((i) => PatientPortalMapper.toPatientInvoiceDTO(i));
  }

  /**
   * 18. Invoice Detail
   */
  async getInvoiceById(patientId, invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        patientId,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    return PatientPortalMapper.toPatientInvoiceDTO(invoice);
  }

  /**
   * 19. Payments List
   */
  async getPayments(patientId, query = {}) {
    const payments = await prisma.payment.findMany({
      where: { patientId },
      include: {
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map((p) => PatientPortalMapper.toPatientPaymentDTO(p));
  }

  /**
   * 20. Payment Options / Gateway Status
   */
  async getPaymentOptions(patientId, invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, patientId },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    const isOnlineEnabled = portalConfig.onlinePaymentsEnabled;
    const provider = portalConfig.paymentGatewayProvider;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(invoice.totalAmount),
      outstandingAmount: Number(invoice.outstandingAmount),
      currency: portalConfig.currency,
      currencySymbol: portalConfig.currencySymbol,
      onlinePaymentsEnabled: isOnlineEnabled,
      gatewayProvider: provider,
      acceptedMethods: isOnlineEnabled
        ? ['ONLINE_CARD', 'UPI', 'NET_BANKING', 'IN_PERSON_CASH_CARD']
        : ['IN_PERSON_CASH_CARD'],
      notice: !isOnlineEnabled
        ? 'Online payments are currently disabled. Please settle outstanding hospital invoices at the hospital billing / front desk counter.'
        : null,
    };
  }

  /**
   * 21. Initiate Online Payment
   */
  async initiatePayment(patientId, invoiceId, { amount, idempotencyKey }) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, patientId },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw ApiError.badRequest('This invoice is already fully paid.');
    }

    if (amount > Number(invoice.outstandingAmount)) {
      throw ApiError.badRequest(
        `Payment amount (₹${amount}) exceeds remaining balance of ₹${Number(invoice.outstandingAmount)}`
      );
    }

    return paymentGatewayService.initiatePayment({
      patientId,
      invoiceId,
      amount,
      idempotencyKey,
    });
  }

  /**
   * 22. Documents List
   */
  async getDocuments(patientId, query = {}) {
    const { category } = query;
    const where = {
      patientId,
      patientVisible: true,
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map((d) => PatientPortalMapper.toPatientDocumentDTO(d, patientId));
  }

  /**
   * 23. Upload Document
   */
  async uploadDocument(patientId, userId, { title, category, fileData, fileName, mimeType }) {
    // 1. Validate MIME
    if (!portalConfig.allowedUploadMimeTypes.includes(mimeType)) {
      throw ApiError.badRequest(
        `Unsupported file type '${mimeType}'. Allowed formats: PDF, JPEG, PNG, WEBP.`
      );
    }

    // 2. Validate approximate size from Base64
    const approximateSizeBytes = Math.ceil((fileData.length * 3) / 4);
    if (approximateSizeBytes > portalConfig.maxUploadSizeBytes) {
      throw ApiError.badRequest(
        `File exceeds maximum upload size of ${portalConfig.maxUploadSizeBytes / (1024 * 1024)}MB.`
      );
    }

    const fileSizeFormatted = `${(approximateSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    const storageKey = `patients/${patientId}/docs/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileUrl = `/api/v1/patient/documents/view/${encodeURIComponent(storageKey)}`;

    const document = await prisma.document.create({
      data: {
        patientId,
        title,
        category: category || 'Medical Document',
        source: 'PATIENT',
        uploadedByUserId: userId,
        patientVisible: true,
        fileUrl,
        fileSize: fileSizeFormatted,
        mimeType,
        storageKey,
        sizeBytes: BigInt(approximateSizeBytes),
      },
    });

    await patientNotificationService.notifyDocumentAvailable(patientId, document.id, title);

    return PatientPortalMapper.toPatientDocumentDTO(document, patientId);
  }

  /**
   * 24. Delete Document (Patient can only delete own uploaded documents)
   */
  async deleteDocument(patientId, documentId) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        patientId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    if (document.source !== 'PATIENT') {
      throw ApiError.forbidden('Patients can only delete documents they uploaded themselves.');
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Document deleted successfully' };
  }

  /**
   * 25. Insurance Policies & Claims (Read-Only)
   */
  async getInsurance(patientId) {
    const [policies, claims] = await Promise.all([
      prisma.insurancePolicy.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.insuranceClaim.findMany({
        where: { patientId },
        include: { policy: true },
        orderBy: { claimDate: 'desc' },
      }),
    ]);

    return {
      policies: policies.map((p) => PatientPortalMapper.toPatientInsurancePolicyDTO(p)),
      claims: claims.map((c) => PatientPortalMapper.toPatientInsuranceClaimDTO(c)),
    };
  }

  /**
   * 26. Health Timeline (Derived aggregate sorted chronologically)
   */
  async getTimeline(patientId) {
    const [appointments, records, prescriptions, labReports, documents] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } } },
      }),
      prisma.medicalRecord.findMany({
        where: {
          patientId,
          portalVisible: true,
          consultation: { status: 'COMPLETED' },
        },
        include: { doctor: { include: { user: true } }, consultation: true },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: { include: { user: true } }, items: true },
      }),
      prisma.labReport.findMany({
        where: {
          order: { patientId },
          status: { in: ['RELEASED', 'VERIFIED'] },
        },
        include: {
          order: {
            include: {
              items: { include: { labTest: true } },
              orderingDoctor: { include: { user: true } },
            },
          },
        },
      }),
      prisma.document.findMany({
        where: { patientId, patientVisible: true, deletedAt: null },
      }),
    ]);

    const timelineEvents = [];

    // Appointments
    appointments.forEach((apt) => {
      timelineEvents.push({
        id: `apt-${apt.id}`,
        type: 'APPOINTMENT',
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        title: `${apt.type} Appointment`,
        subtitle: apt.doctor?.user?.fullName ? `Dr. ${apt.doctor.user.fullName} (${apt.doctor.department})` : 'Hospital Doctor',
        status: apt.status,
        entityId: apt.id,
        summary: apt.reason || `Appointment #${apt.appointmentNumber}`,
      });
    });

    // Medical Records
    records.forEach((rec) => {
      timelineEvents.push({
        id: `rec-${rec.id}`,
        type: 'CLINICAL_VISIT',
        date: rec.recordDate,
        title: rec.title || 'Doctor Consultation Record',
        subtitle: rec.doctor?.user?.fullName ? `Dr. ${rec.doctor.user.fullName}` : 'Clinical Consultation',
        status: 'COMPLETED',
        entityId: rec.id,
        summary: rec.diagnosis ? `Diagnosis: ${rec.diagnosis}` : rec.summary || 'Consultation completed',
      });
    });

    // Prescriptions
    prescriptions.forEach((rx) => {
      const medList = rx.items.map((i) => i.medicineName).join(', ');
      timelineEvents.push({
        id: `rx-${rx.id}`,
        type: 'PRESCRIPTION',
        date: rx.prescribedDate,
        title: `Prescription #${rx.prescriptionNumber}`,
        subtitle: rx.doctor?.user?.fullName ? `Dr. ${rx.doctor.user.fullName}` : 'Prescription',
        status: rx.status,
        entityId: rx.id,
        summary: medList || 'Prescribed medications',
      });
    });

    // Lab Reports
    labReports.forEach((rep) => {
      const testNames = rep.order?.items.map((i) => i.testNameSnapshot).join(', ') || 'Diagnostic Report';
      timelineEvents.push({
        id: `lab-${rep.id}`,
        type: 'LAB_REPORT',
        date: rep.releasedAt || rep.createdAt,
        title: testNames,
        subtitle: rep.isAmended ? 'Amended Diagnostic Report' : 'Diagnostic Lab Report',
        status: rep.status,
        entityId: rep.id,
        summary: `Report #${rep.reportNumber} released`,
      });
    });

    // Documents
    documents.forEach((doc) => {
      timelineEvents.push({
        id: `doc-${doc.id}`,
        type: 'DOCUMENT',
        date: doc.uploadedAt,
        title: doc.title,
        subtitle: doc.source === 'PATIENT' ? 'Patient Upload' : 'Hospital Document',
        status: 'ACTIVE',
        entityId: doc.id,
        summary: `Category: ${doc.category}`,
      });
    });

    // Sort descending by date
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    return timelineEvents;
  }

  /**
   * 27. Universal Patient Search (Strictly scoped to patientId)
   */
  async search(patientId, { q }) {
    if (!q || q.trim().length < 2) {
      throw ApiError.badRequest('Search query must be at least 2 characters');
    }

    const term = q.trim();

    const [appointments, records, prescriptions, labReports] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId,
          OR: [
            { reason: { contains: term, mode: 'insensitive' } },
            { appointmentNumber: { contains: term, mode: 'insensitive' } },
            { doctor: { user: { fullName: { contains: term, mode: 'insensitive' } } } },
            { doctor: { department: { contains: term, mode: 'insensitive' } } },
          ],
        },
        include: { doctor: { include: { user: true } } },
        take: 10,
      }),

      prisma.medicalRecord.findMany({
        where: {
          patientId,
          portalVisible: true,
          consultation: { status: 'COMPLETED' },
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { diagnosis: { contains: term, mode: 'insensitive' } },
            { summary: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: { doctor: { include: { user: true } }, consultation: true },
        take: 10,
      }),

      prisma.prescription.findMany({
        where: {
          patientId,
          OR: [
            { prescriptionNumber: { contains: term, mode: 'insensitive' } },
            { items: { some: { medicineName: { contains: term, mode: 'insensitive' } } } },
          ],
        },
        include: { doctor: { include: { user: true } }, items: true },
        take: 10,
      }),

      prisma.labReport.findMany({
        where: {
          order: { patientId },
          status: { in: ['RELEASED', 'VERIFIED'] },
          OR: [
            { reportNumber: { contains: term, mode: 'insensitive' } },
            { order: { items: { some: { testNameSnapshot: { contains: term, mode: 'insensitive' } } } } },
          ],
        },
        include: {
          order: {
            include: {
              items: { include: { labTest: true } },
              orderingDoctor: { include: { user: true } },
            },
          },
        },
        take: 10,
      }),
    ]);

    return {
      query: term,
      results: {
        appointments: appointments.map((a) => PatientPortalMapper.toPatientAppointmentDTO(a)),
        medicalRecords: records.map((r) => PatientPortalMapper.toPatientMedicalRecordDTO(r)),
        prescriptions: prescriptions.map((p) => PatientPortalMapper.toPatientPrescriptionDTO(p)),
        labReports: labReports.map((l) => PatientPortalMapper.toPatientLabReportDTO(l)),
      },
    };
  }

  /**
   * 28. Notifications List
   */
  async getNotifications(userId, query = {}) {
    if (!userId) return { notifications: [], unreadCount: 0 };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => PatientPortalMapper.toPatientNotificationDTO(n)),
      unreadCount,
    };
  }

  /**
   * 29. Mark Notification Read
   */
  async markNotificationRead(userId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return PatientPortalMapper.toPatientNotificationDTO(updated);
  }

  /**
   * 30. Mark All Notifications Read
   */
  async markAllNotificationsRead(userId) {
    if (!userId) return { count: 0 };

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { count: result.count };
  }
}

module.exports = new PatientPortalService();
