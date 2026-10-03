const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NurseDashboardService {
  /**
   * Get comprehensive dashboard metrics, tasks, and summaries for the active nurse
   */
  async getDashboard(nurseId) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');

    // 1. Fetch Nurse Profile & Shift details
    const nurse = await prisma.nurseProfile.findUnique({
      where: { id: nurseId },
      include: {
        user: { select: { fullName: true, email: true, employeeId: true } },
      },
    });

    if (!nurse) throw ApiError.notFound('Nurse profile not found');

    // 2. Fetch Active Assignments
    const activeAssignments = await prisma.nurseAssignment.findMany({
      where: { nurseId, isActive: true },
      include: {
        patient: {
          include: {
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
            },
            vitalSigns: {
              orderBy: { recordedAt: 'desc' },
              take: 1,
            },
            nursingNotes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            medicationAdministrations: {
              where: { status: { in: ['SCHEDULED', 'DUE'] } },
            },
          },
        },
      },
    });

    const assignedPatientIds = activeAssignments.map((a) => a.patientId);

    // 3. Today's Date Range (00:00 to 23:59:59)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 4. Metric Counts (Sequential to maintain single connection stability)
    const pendingMedsCount = await prisma.medicationAdministration.count({
      where: {
        patientId: { in: assignedPatientIds },
        status: { in: ['SCHEDULED', 'DUE'] },
      },
    });

    const administeredTodayCount = await prisma.medicationAdministration.count({
      where: {
        nurseId,
        status: 'ADMINISTERED',
        administeredAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const flaggedVitalsCount = await prisma.vitalSign.count({
      where: {
        patientId: { in: assignedPatientIds },
        isFlagged: true,
      },
    });

    const notesTodayCount = await prisma.nursingNote.count({
      where: {
        nurseId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    // 5. Urgent Tasks (Meds due now or within next 1 hour)
    const urgentMedications = await prisma.medicationAdministration.findMany({
      where: {
        patientId: { in: assignedPatientIds },
        status: { in: ['SCHEDULED', 'DUE'] },
        scheduledAt: { lte: new Date(now.getTime() + 60 * 60 * 1000) },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
            },
          },
        },
      },
    });

    // 6. Recent Vitals Recorded
    const recentVitals = await prisma.vitalSign.findMany({
      where: {
        patientId: { in: assignedPatientIds },
      },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      include: {
        patient: { select: { id: true, fullName: true, patientIdNumber: true } },
        nurse: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    // 7. Recent Nursing Notes
    const recentNotes = await prisma.nursingNote.findMany({
      where: {
        patientId: { in: assignedPatientIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        patient: { select: { id: true, fullName: true, patientIdNumber: true } },
        nurse: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    // 8. Formatted Assigned Patients Summary
    const patientsSummary = activeAssignments.map((a) => {
      const p = a.patient;
      const admission = p.admissions[0] || null;
      const latestVital = p.vitalSigns[0] || null;
      const latestNote = p.nursingNotes[0] || null;
      const pendingMeds = p.medicationAdministrations.length;

      return {
        id: p.id,
        fullName: p.fullName,
        patientIdNumber: p.patientIdNumber,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        ward: admission?.ward || 'General Medical',
        roomNumber: admission?.roomNumber || 'Room 101',
        bedNumber: admission?.bedNumber || 'Bed 1',
        diagnosis: admission?.admittingDiagnosis || 'Observation',
        latestVital: latestVital
          ? {
              bloodPressure: latestVital.bloodPressure,
              pulse: latestVital.pulse,
              temperature: latestVital.temperature,
              oxygenSaturation: latestVital.oxygenSaturation,
              isFlagged: latestVital.isFlagged,
              flagReason: latestVital.flagReason,
              recordedAt: latestVital.recordedAt,
            }
          : null,
        latestNoteSnippet: latestNote ? latestNote.observation.slice(0, 80) : null,
        pendingMedsCount: pendingMeds,
      };
    });

    return {
      nurse: {
        id: nurse.id,
        fullName: nurse.user.fullName,
        email: nurse.user.email,
        employeeId: nurse.user.employeeId,
        department: nurse.department,
        shift: nurse.shift,
        ward: nurse.ward,
        qualifications: nurse.qualifications,
        licenseNumber: nurse.licenseNumber,
      },
      metrics: {
        assignedPatientsCount: activeAssignments.length,
        pendingMedsCount,
        administeredTodayCount,
        flaggedVitalsCount,
        notesTodayCount,
      },
      urgentTasks: {
        medications: urgentMedications.map((m) => ({
          id: m.id,
          medicineName: m.medicineName,
          dosage: m.dosage,
          route: m.route,
          scheduledAt: m.scheduledAt,
          status: m.status,
          patientId: m.patient.id,
          patientName: m.patient.fullName,
          patientNumber: m.patient.patientIdNumber,
          bedNumber: m.patient.admissions[0]?.bedNumber || 'Bed 1',
          ward: m.patient.admissions[0]?.ward || 'Ward 3B',
        })),
      },
      assignedPatients: patientsSummary,
      recentVitals,
      recentNotes,
    };
  }
}

module.exports = new NurseDashboardService();
