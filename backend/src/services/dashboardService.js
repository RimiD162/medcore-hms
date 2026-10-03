const prisma = require('../config/prisma');

class DashboardService {
  /**
   * Get aggregated dashboard statistics and operational summaries
   */
  async getDashboardSummary(doctorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      doctorProfile,
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      pendingConsultationsCount,
      followUpsCount,
      myPatientsCount,
      pendingLabReportsCount,
      todayAppointments,
      pendingConsultations,
      recentPatients,
      recentLabReports,
      upcomingFollowUps,
    ] = await Promise.all([
      // Doctor info
      prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),

      // 1. Today's Appointments Count
      prisma.appointment.count({
        where: {
          doctorId,
          appointmentDate: { gte: today, lt: tomorrow },
        },
      }),

      // 2. Upcoming Appointments Count
      prisma.appointment.count({
        where: {
          doctorId,
          appointmentDate: { gte: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),

      // 3. Pending Consultations Count
      prisma.consultation.count({
        where: {
          doctorId,
          status: 'DRAFT',
        },
      }),

      // 4. Follow-ups Count
      prisma.followUp.count({
        where: {
          doctorId,
          status: 'Pending',
        },
      }),

      // 5. Total Patients Count for this Doctor
      prisma.patient.count({
        where: {
          appointments: { some: { doctorId } },
        },
      }),

      // 6. Pending Lab Reports Count
      prisma.labReport.count({
        where: {
          orderedById: doctorId,
          status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] },
        },
      }),

      // 7. Today's Appointment List
      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: { gte: today, lt: tomorrow },
        },
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
            },
          },
          consultation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { appointmentTime: 'asc' },
      }),

      // 8. Pending Consultations (Active Drafts)
      prisma.consultation.findMany({
        where: {
          doctorId,
          status: 'DRAFT',
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
            },
          },
          appointment: {
            select: {
              id: true,
              appointmentNumber: true,
              appointmentTime: true,
              type: true,
            },
          },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),

      // 9. Recent Patients
      prisma.patient.findMany({
        where: {
          appointments: { some: { doctorId } },
        },
        include: {
          appointments: {
            where: { doctorId },
            orderBy: { appointmentDate: 'desc' },
            take: 1,
            select: {
              appointmentDate: true,
              appointmentTime: true,
              type: true,
              status: true,
            },
          },
          consultations: {
            where: { doctorId },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              diagnosis: true,
              status: true,
            },
          },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),

      // 10. Recent Lab Reports
      prisma.labReport.findMany({
        where: {
          orderedById: doctorId,
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              patientIdNumber: true,
            },
          },
        },
        take: 5,
        orderBy: { orderedDate: 'desc' },
      }),

      // 11. Upcoming Follow-ups
      prisma.followUp.findMany({
        where: {
          doctorId,
          status: 'Pending',
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
      }),
    ]);

    return {
      doctor: {
        id: doctorProfile.id,
        name: doctorProfile.user.fullName,
        email: doctorProfile.user.email,
        department: doctorProfile.department,
        specialization: doctorProfile.specialization,
        roomNumber: doctorProfile.roomNumber,
        status: doctorProfile.status,
        avatarUrl: doctorProfile.user.avatarUrl,
      },
      stats: {
        todayAppointments: todayAppointmentsCount,
        upcomingAppointments: upcomingAppointmentsCount,
        pendingConsultations: pendingConsultationsCount,
        followUps: followUpsCount,
        myPatients: myPatientsCount,
        pendingLabReports: pendingLabReportsCount,
      },
      todayAppointments,
      pendingConsultations,
      recentPatients: recentPatients.map((p) => ({
        id: p.id,
        patientIdNumber: p.patientIdNumber,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        lastVisit: p.appointments[0]?.appointmentDate || null,
        lastDiagnosis: p.consultations[0]?.diagnosis || 'Routine Checkup',
      })),
      recentLabReports,
      upcomingFollowUps,
    };
  }
}

module.exports = new DashboardService();
