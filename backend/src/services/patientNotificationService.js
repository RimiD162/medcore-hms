/**
 * Patient Notification Service
 * Dispatches generic, zero-PHI notifications to linked patient users.
 * Never leaks test names, diagnoses, or sensitive metadata in notification text.
 */

const prisma = require('../config/prisma');

class PatientNotificationService {
  /**
   * Helper to find linked User ID for a given patient
   */
  async getPatientUserId(patientId) {
    if (!patientId) return null;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });
    return patient?.userId || null;
  }

  /**
   * Safe post-commit dispatcher
   */
  async notifyPatient(patientId, { title, message, type = 'INFO', entityType = null, entityId = null }) {
    try {
      const userId = await this.getPatientUserId(patientId);
      if (!userId) {
        // Patient does not have an active portal account linked; gracefully skip
        return null;
      }

      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          entityType,
          entityId,
          isRead: false,
        },
      });
    } catch (err) {
      console.warn('⚠️ Warning: Failed to deliver patient notification:', err.message);
      return null;
    }
  }

  // Specialized Hooks (Generic Wording Only)
  async notifyAppointmentConfirmed(patientId, appointmentId, appointmentDate) {
    return this.notifyPatient(patientId, {
      title: 'Appointment Confirmed',
      message: `Your upcoming hospital appointment on ${appointmentDate} has been confirmed.`,
      type: 'APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
    });
  }

  async notifyAppointmentRescheduled(patientId, appointmentId, newDate, newTime) {
    return this.notifyPatient(patientId, {
      title: 'Appointment Rescheduled',
      message: `Your appointment has been rescheduled to ${newDate} at ${newTime}.`,
      type: 'APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
    });
  }

  async notifyAppointmentCancelled(patientId, appointmentId) {
    return this.notifyPatient(patientId, {
      title: 'Appointment Cancelled',
      message: 'Your hospital appointment has been cancelled.',
      type: 'APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointmentId,
    });
  }

  async notifyPrescriptionCreated(patientId, prescriptionId) {
    return this.notifyPatient(patientId, {
      title: 'Prescription Available',
      message: 'A new digital prescription has been prescribed by your doctor.',
      type: 'INFO',
      entityType: 'Prescription',
      entityId: prescriptionId,
    });
  }

  async notifyLabReportReleased(patientId, reportId, isAmended = false) {
    return this.notifyPatient(patientId, {
      title: isAmended ? 'Lab Report Amended' : 'Laboratory Report Available',
      message: isAmended
        ? 'An amended diagnostic laboratory report has been released to your health record.'
        : 'A new diagnostic laboratory report is now available for viewing.',
      type: 'LAB_RESULT',
      entityType: 'LabReport',
      entityId: reportId,
    });
  }

  async notifyInvoiceGenerated(patientId, invoiceId, invoiceNumber) {
    return this.notifyPatient(patientId, {
      title: 'New Hospital Invoice',
      message: `A new billing invoice #${invoiceNumber} is available for review.`,
      type: 'INFO',
      entityType: 'Invoice',
      entityId: invoiceId,
    });
  }

  async notifyPaymentRecorded(patientId, paymentId, paymentNumber) {
    return this.notifyPatient(patientId, {
      title: 'Payment Received',
      message: `Payment receipt #${paymentNumber} has been recorded successfully.`,
      type: 'INFO',
      entityType: 'Payment',
      entityId: paymentId,
    });
  }

  async notifyPaymentFailed(patientId, invoiceId) {
    return this.notifyPatient(patientId, {
      title: 'Payment Transaction Failed',
      message: 'Your recent online payment attempt could not be completed. Please retry or settle at the front desk.',
      type: 'WARNING',
      entityType: 'Invoice',
      entityId: invoiceId,
    });
  }

  async notifyDocumentAvailable(patientId, documentId, title) {
    return this.notifyPatient(patientId, {
      title: 'New Document in Vault',
      message: `A new document "${title}" is available in your document vault.`,
      type: 'INFO',
      entityType: 'Document',
      entityId: documentId,
    });
  }
}

module.exports = new PatientNotificationService();
