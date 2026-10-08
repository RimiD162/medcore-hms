/**
 * Authoritative DTO Mapper Layer for Patient Portal
 * Strict allowlisting of patient-safe projections.
 * Redacts staff identities, internal audit IDs, doctor private notes, and raw internals.
 */

const { isInvoiceOverdue } = require('./financeMoney');

class PatientPortalMapper {
  /**
   * Safe Patient Profile DTO
   */
  static toPatientProfileDTO(patient, user = null) {
    if (!patient) return null;
    return {
      id: patient.id,
      patientIdNumber: patient.patientIdNumber,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      email: user?.email || patient.email || null,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
      status: patient.status,
      registrationDate: patient.registrationDate || patient.createdAt,
      createdAt: patient.createdAt,
      user: user
        ? {
            id: user.id,
            email: user.email,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLoginAt: user.lastLoginAt,
          }
        : null,
    };
  }

  /**
   * Safe Public Doctor Projection (No private contact or license numbers)
   */
  static toPublicDoctorDTO(doctorProfile) {
    if (!doctorProfile) return null;
    return {
      id: doctorProfile.id,
      name: doctorProfile.user?.fullName || doctorProfile.name || 'Doctor',
      department: doctorProfile.department,
      specialization: doctorProfile.specialization,
      experienceYears: doctorProfile.experienceYears,
      qualifications: doctorProfile.qualifications || [],
      bio: doctorProfile.bio,
      roomNumber: doctorProfile.roomNumber,
      consultationFee: doctorProfile.consultationFee ? Number(doctorProfile.consultationFee) : 500,
      avatarUrl: doctorProfile.user?.avatarUrl || null,
    };
  }

  /**
   * Safe Appointment DTO
   */
  static toPatientAppointmentDTO(appointment) {
    if (!appointment) return null;
    return {
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      cancelReason: appointment.cancelReason,
      cancelledAt: appointment.cancelledAt,
      isCheckedIn: appointment.isCheckedIn,
      checkedInAt: appointment.checkedInAt,
      rescheduleCount: appointment.rescheduleCount || 0,
      createdAt: appointment.createdAt,
      doctor: appointment.doctor
        ? this.toPublicDoctorDTO(appointment.doctor)
        : null,
    };
  }

  /**
   * Safe Medical Record DTO (Excludes Doctor Private Notes and Drafts)
   */
  static toPatientMedicalRecordDTO(record) {
    if (!record) return null;
    const consultation = record.consultation || {};
    return {
      id: record.id,
      recordNumber: record.recordNumber,
      title: record.title,
      summary: record.summary,
      diagnosis: record.diagnosis || consultation.diagnosis || null,
      visitDate: record.recordDate || record.createdAt,
      vitals: record.vitalsSnapshot || consultation.vitals || null,
      chiefComplaint: consultation.chiefComplaint || null,
      symptoms: consultation.symptoms || [],
      treatmentPlan: consultation.treatmentPlan || null,
      clinicalNotes: consultation.clinicalNotes || record.notes || null,
      doctor: record.doctor ? this.toPublicDoctorDTO(record.doctor) : null,
      documents: (record.documents || []).map((d) => this.toPatientDocumentDTO(d)),
      createdAt: record.createdAt,
    };
  }

  /**
   * Safe Prescription DTO
   */
  static toPatientPrescriptionDTO(prescription) {
    if (!prescription) return null;
    return {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      prescribedDate: prescription.prescribedDate || prescription.createdAt,
      status: prescription.status,
      dispensingStatus: prescription.dispensingStatus || 'PENDING',
      notes: prescription.notes,
      appointmentId: prescription.consultation?.appointmentId || null,
      doctor: prescription.doctor ? this.toPublicDoctorDTO(prescription.doctor) : null,
      items: (prescription.items || []).map((item) => ({
        id: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        route: item.route || 'Oral',
        instructions: item.instructions || null,
      })),
      createdAt: prescription.createdAt,
    };
  }

  /**
   * Safe Released Lab Report DTO from Immutable Released Snapshot
   */
  static toPatientLabReportDTO(report) {
    if (!report) return null;
    const items = report.order?.items || [];
    const testNames = items.map((i) => i.testNameSnapshot).join(', ') || 'Diagnostic Laboratory Test';
    const categoryName = items[0]?.labTest?.category || 'Clinical Pathology';

    return {
      id: report.id,
      reportNumber: report.reportNumber,
      testName: testNames,
      category: categoryName,
      status: report.status,
      isAmended: report.isAmended,
      amendedAt: report.amendedAt,
      releasedAt: report.releasedAt || report.verifiedAt || report.createdAt,
      orderedAt: report.order?.orderedAt || report.createdAt,
      doctor: report.order?.orderingDoctor
        ? this.toPublicDoctorDTO(report.order.orderingDoctor)
        : null,
      contentSnapshot: report.contentSnapshot || null,
      disclaimer: "Flags compare values with the laboratory's configured reference information. Please discuss your results with your doctor.",
      createdAt: report.createdAt,
    };
  }

  /**
   * Safe Invoice DTO
   */
  static toPatientInvoiceDTO(invoice) {
    if (!invoice) return null;
    const isOverdue = isInvoiceOverdue(invoice);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      invoiceDate: invoice.invoiceDate,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      refundedAmount: Number(invoice.refundedAmount || 0),
      outstandingAmount: Number(invoice.outstandingAmount),
      status: invoice.status,
      isOverdue,
      cancelledAt: invoice.cancelledAt,
      cancelReason: invoice.cancelReason,
      items: (invoice.items || []).map((item) => ({
        id: item.id,
        serviceName: item.serviceName,
        category: item.category,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount),
        totalPrice: Number(item.totalPrice),
      })),
      payments: (invoice.payments || []).map((p) => this.toPatientPaymentDTO(p)),
      createdAt: invoice.createdAt,
    };
  }

  /**
   * Safe Payment DTO
   */
  static toPatientPaymentDTO(payment) {
    if (!payment) return null;
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.invoiceNumber || null,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      paidAt: payment.paidAt,
      status: payment.status,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Safe Document DTO
   */
  static toPatientDocumentDTO(doc, currentPatientId = null) {
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      source: doc.source || 'STAFF',
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      isOwnUpload: doc.source === 'PATIENT' || (currentPatientId && doc.patientId === currentPatientId && doc.source === 'PATIENT'),
    };
  }

  /**
   * Safe Insurance Policy DTO
   */
  static toPatientInsurancePolicyDTO(policy) {
    if (!policy) return null;
    return {
      id: policy.id,
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      coverageType: policy.coverageType,
      coverageLimit: Number(policy.coverageLimit),
      validFrom: policy.validFrom,
      validThru: policy.validThru,
      status: policy.status,
      createdAt: policy.createdAt,
    };
  }

  /**
   * Safe Insurance Claim DTO
   */
  static toPatientInsuranceClaimDTO(claim) {
    if (!claim) return null;
    return {
      id: claim.id,
      claimNumber: claim.claimNumber,
      policyId: claim.policyId,
      provider: claim.policy?.provider || null,
      policyNumber: claim.policy?.policyNumber || null,
      claimDate: claim.claimDate,
      amount: Number(claim.amount),
      approvedAmount: claim.approvedAmount ? Number(claim.approvedAmount) : null,
      status: claim.status,
      description: claim.description,
      adjudicatedAt: claim.adjudicatedAt,
      createdAt: claim.createdAt,
    };
  }

  /**
   * Safe Notification DTO
   */
  static toPatientNotificationDTO(notification) {
    if (!notification) return null;
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      readAt: notification.readAt,
      entityType: notification.entityType,
      entityId: notification.entityId,
      createdAt: notification.createdAt,
    };
  }
}

module.exports = PatientPortalMapper;
