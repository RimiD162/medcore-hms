const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ConsultationService {
  /**
   * List pending / in-progress consultations for doctor
   */
  async getConsultations(doctorId, query = {}) {
    const { status = 'DRAFT', search, page = 1, limit = 20 } = query;

    const where = {
      doctorId,
      ...(status && { status }),
    };

    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { appointment: { appointmentNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, consultations] = await Promise.all([
      prisma.consultation.count({ where }),
      prisma.consultation.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
              bloodGroup: true,
              phone: true,
              allergies: true,
              chronicConditions: true,
            },
          },
          appointment: {
            select: {
              id: true,
              appointmentNumber: true,
              appointmentDate: true,
              appointmentTime: true,
              type: true,
              reason: true,
              status: true,
            },
          },
          prescription: {
            include: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      consultations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get or initialize a consultation for an appointment
   */
  async getOrCreateForAppointment(doctorId, appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
      include: {
        patient: {
          include: {
            prescriptions: {
              where: { doctorId },
              orderBy: { prescribedDate: 'desc' },
              take: 3,
              include: { items: true },
            },
            labReports: {
              where: { orderedById: doctorId },
              orderBy: { orderedDate: 'desc' },
              take: 3,
            },
            medicalRecords: {
              orderBy: { recordDate: 'desc' },
              take: 3,
            },
          },
        },
        consultation: {
          include: {
            prescription: {
              include: { items: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (appointment.consultation) {
      return {
        consultation: appointment.consultation,
        patient: appointment.patient,
        appointment: {
          id: appointment.id,
          appointmentNumber: appointment.appointmentNumber,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          type: appointment.type,
          reason: appointment.reason,
          status: appointment.status,
        },
      };
    }

    // Initialize a new DRAFT consultation
    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: appointment.id,
        doctorId,
        patientId: appointment.patientId,
        status: 'DRAFT',
        chiefComplaint: appointment.reason || null,
        symptoms: [],
        vitals: null,
      },
    });

    return {
      consultation,
      patient: appointment.patient,
      appointment: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        type: appointment.type,
        reason: appointment.reason,
        status: appointment.status,
      },
    };
  }

  /**
   * Save consultation draft
   */
  async saveDraft(doctorId, consultationId, data) {
    const existing = await prisma.consultation.findFirst({
      where: { id: consultationId, doctorId },
    });

    if (!existing) {
      throw ApiError.notFound('Consultation not found');
    }

    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('Cannot edit a completed consultation');
    }

    const { chiefComplaint, symptoms, vitals, clinicalNotes, diagnosis, treatmentPlan, doctorNotes } = data;

    return prisma.consultation.update({
      where: { id: consultationId },
      data: {
        ...(chiefComplaint !== undefined && { chiefComplaint }),
        ...(symptoms !== undefined && { symptoms }),
        ...(vitals !== undefined && { vitals }),
        ...(clinicalNotes !== undefined && { clinicalNotes }),
        ...(diagnosis !== undefined && { diagnosis }),
        ...(treatmentPlan !== undefined && { treatmentPlan }),
        ...(doctorNotes !== undefined && { doctorNotes }),
      },
      include: {
        patient: true,
        appointment: true,
      },
    });
  }

  /**
   * Complete Consultation in a single atomic transaction
   */
  async completeConsultation(doctorId, consultationId, data) {
    const existing = await prisma.consultation.findFirst({
      where: { id: consultationId, doctorId },
      include: { appointment: true, patient: true },
    });

    if (!existing) {
      throw ApiError.notFound('Consultation not found');
    }

    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('This consultation is already marked as completed');
    }

    const { chiefComplaint, symptoms, vitals, clinicalNotes, diagnosis, treatmentPlan, doctorNotes, followUp } = data;

    // Run atomic multi-table transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark Consultation as COMPLETED
      const completedConsultation = await tx.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'COMPLETED',
          chiefComplaint,
          symptoms,
          vitals,
          clinicalNotes,
          diagnosis,
          treatmentPlan,
          doctorNotes,
          completedAt: new Date(),
        },
      });

      // 2. Mark Appointment as COMPLETED
      await tx.appointment.update({
        where: { id: existing.appointmentId },
        data: {
          status: 'COMPLETED',
        },
      });

      // 3. Generate unique record number
      const recordCount = await tx.medicalRecord.count();
      const recordNumber = `REC-2026-${String(recordCount + 101).padStart(3, '0')}`;

      // 4. Create or Update Medical Record
      const medicalRecord = await tx.medicalRecord.create({
        data: {
          recordNumber,
          patientId: existing.patientId,
          doctorId,
          consultationId: existing.id,
          recordType: 'Consultation Record',
          title: `Clinical Consultation: ${diagnosis}`,
          summary: `Chief Complaint: ${chiefComplaint}. Assessment: ${diagnosis}. Treatment Plan: ${treatmentPlan}`,
          diagnosis,
          notes: clinicalNotes,
          vitalsSnapshot: vitals || null,
          recordDate: new Date(),
        },
      });

      // 5. Create Follow-up if requested
      let createdFollowUp = null;
      if (followUp && followUp.followUpDate) {
        createdFollowUp = await tx.followUp.create({
          data: {
            doctorId,
            patientId: existing.patientId,
            followUpDate: new Date(followUp.followUpDate),
            reason: followUp.reason,
            notes: followUp.notes || null,
            status: 'Pending',
          },
        });
      }

      // 6. Create Notification for Doctor
      await tx.notification.create({
        data: {
          userId: existing.patientId, // or doctor user
          title: 'Consultation Completed',
          message: `Consultation for ${existing.patient.fullName} (MRN: ${existing.patient.patientIdNumber}) completed. Diagnosis: ${diagnosis}`,
          type: 'INFO',
          entityType: 'Consultation',
          entityId: completedConsultation.id,
        },
      });

      return {
        consultation: completedConsultation,
        medicalRecord,
        followUp: createdFollowUp,
      };
    });

    return result;
  }
}

module.exports = new ConsultationService();
