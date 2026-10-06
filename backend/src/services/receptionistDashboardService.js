const prisma = require('../config/prisma');

class ReceptionistDashboardService {
  /**
   * Get live aggregated statistics and operational queue summaries for front desk
   */
  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayRegistrationsCount,
      todayAppointmentsCount,
      waitingPatientsCount,
      upcomingAppointmentsCount,
      pendingInvoicesCount,
      todayPayments,
      todayAppointments,
      waitingPatientsList,
      recentRegistrations,
      recentEmergencies,
    ] = await Promise.all([
      // 1. Today's Registrations Count
      prisma.patient.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // 2. Today's Appointments Count
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
        },
      }),

      // 3. Waiting Patients Count (Today, Checked In, Not Completed or Cancelled)
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          isCheckedIn: true,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),

      // 4. Upcoming Appointments Count
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),

      // 5. Pending Invoices Count (Invoices with outstanding balance > 0)
      prisma.invoice.count({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
      }),

      // 6. Today's Collections (Payments with paidAt today)
      prisma.payment.findMany({
        where: {
          paidAt: { gte: today, lt: tomorrow },
        },
        select: {
          amount: true,
        },
      }),

      // 7. Today's Appointments List
      prisma.appointment.findMany({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
        },
        select: {
          id: true,
          appointmentNumber: true,
          appointmentTime: true,
          type: true,
          status: true,
          isCheckedIn: true,
          checkedInAt: true,
          reason: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              gender: true,
              age: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              department: true,
              specialization: true,
              roomNumber: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { appointmentTime: 'asc' },
      }),

      // 8. Waiting Patients List (Live Lobby Queue)
      prisma.appointment.findMany({
        where: {
          appointmentDate: { gte: today, lt: tomorrow },
          isCheckedIn: true,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        select: {
          id: true,
          appointmentNumber: true,
          appointmentTime: true,
          checkedInAt: true,
          status: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              roomNumber: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { checkedInAt: 'asc' },
      }),

      // 9. Recent Patient Registrations
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientIdNumber: true,
          fullName: true,
          gender: true,
          age: true,
          phone: true,
          registrationSource: true,
          createdAt: true,
        },
      }),

      // 10. Active Emergency Intakes
      prisma.emergencyRegistration.findMany({
        where: {
          status: { in: ['TRIAGED', 'IN_TREATMENT', 'ADMITTED'] },
        },
        take: 5,
        orderBy: { arrivedAt: 'desc' },
        select: {
          id: true,
          emergencyNumber: true,
          priority: true,
          reason: true,
          status: true,
          arrivedAt: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    // Calculate today's collections total
    const todayCollectionsTotal = todayPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return {
      stats: {
        todayRegistrations: todayRegistrationsCount,
        todayAppointments: todayAppointmentsCount,
        waitingPatients: waitingPatientsCount,
        upcomingAppointments: upcomingAppointmentsCount,
        pendingInvoices: pendingInvoicesCount,
        todayCollections: todayCollectionsTotal,
      },
      todayAppointments,
      waitingPatients: waitingPatientsList.map((item) => {
        const waitingMinutes = item.checkedInAt
          ? Math.max(0, Math.floor((Date.now() - new Date(item.checkedInAt).getTime()) / 60000))
          : 0;

        return {
          ...item,
          waitingMinutes,
          waitingDurationFormatted: `${waitingMinutes} min`,
        };
      }),
      recentRegistrations,
      recentEmergencies,
    };
  }
}

module.exports = new ReceptionistDashboardService();
