const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generatePatientId } = require('../utils/patientIdGenerator');

class ReceptionistPatientService {
  /**
   * Search, filter, and paginate patients directory
   */
  async getPatients(query = {}) {
    const {
      search,
      gender,
      bloodGroup,
      registrationDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { patientIdNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }

    if (registrationDate) {
      const targetDate = new Date(registrationDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.createdAt = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        select: {
          id: true,
          patientIdNumber: true,
          fullName: true,
          age: true,
          gender: true,
          bloodGroup: true,
          phone: true,
          email: true,
          status: true,
          registrationSource: true,
          createdAt: true,
          _count: {
            select: {
              appointments: true,
              invoices: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
    ]);

    return {
      patients,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Duplicate detection check based on phone number or name + DOB
   */
  async checkDuplicates(phone, fullName, dateOfBirth) {
    const conditions = [];

    if (phone) {
      conditions.push({ phone });
    }

    if (fullName && dateOfBirth) {
      conditions.push({
        fullName: { equals: fullName, mode: 'insensitive' },
        dateOfBirth: new Date(dateOfBirth),
      });
    }

    if (conditions.length === 0) {
      return [];
    }

    return prisma.patient.findMany({
      where: {
        OR: conditions,
      },
      select: {
        id: true,
        patientIdNumber: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true,
      },
    });
  }

  /**
   * Register a new patient with duplicate verification and race-safe ID generation
   */
  async registerPatient(data, registeredById) {
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      emergencyPhone,
      allergies = [],
      chronicConditions = [],
      registrationSource = 'Standard',
      allowDuplicate = false,
    } = data;

    // Check for potential duplicate records if not explicitly bypassed
    if (!allowDuplicate) {
      const duplicates = await this.checkDuplicates(phone, fullName, dateOfBirth);
      if (duplicates.length > 0) {
        return {
          duplicateWarning: true,
          message: 'Potential duplicate patient records found with matching contact or demographic details',
          duplicates,
        };
      }
    }

    // Calculate age if dateOfBirth provided
    let age = null;
    if (dateOfBirth) {
      const birth = new Date(dateOfBirth);
      const diffMs = Date.now() - birth.getTime();
      const ageDate = new Date(diffMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // Race-safe creation inside transaction with ID sequence retry
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const newPatient = await prisma.$transaction(async (tx) => {
          const patientIdNumber = await generatePatientId(tx);

          return tx.patient.create({
            data: {
              patientIdNumber,
              fullName,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              age,
              gender,
              bloodGroup: bloodGroup || null,
              phone,
              email: email || null,
              address: address || null,
              emergencyContact: emergencyContact || null,
              emergencyPhone: emergencyPhone || null,
              allergies,
              chronicConditions,
              registrationSource,
              status: 'Active',
            },
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
              bloodGroup: true,
              phone: true,
              email: true,
              address: true,
              emergencyContact: true,
              emergencyPhone: true,
              allergies: true,
              chronicConditions: true,
              status: true,
              registrationSource: true,
              createdAt: true,
            },
          });
        }, { maxWait: 15000, timeout: 30000 });

        return {
          duplicateWarning: false,
          patient: newPatient,
        };
      } catch (err) {
        // Retry on unique constraint collision on patientIdNumber
        if (err.code === 'P2002' && attempt < maxRetries) {
          continue;
        }
        throw err;
      }
    }

    throw ApiError.internal('Unable to generate a unique Patient ID after multiple attempts. Please try again.');
  }

  /**
   * Get Receptionist-Safe Patient Profile
   * Explicit select projection strictly excluding clinical diagnoses, doctor/nurse notes, and lab details
   */
  async getPatientById(patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientIdNumber: true,
        fullName: true,
        dateOfBirth: true,
        age: true,
        gender: true,
        bloodGroup: true,
        phone: true,
        email: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        allergies: true,
        chronicConditions: true,
        status: true,
        registrationDate: true,
        registrationSource: true,
        createdAt: true,
        // 1. Appointments Operational History
        appointments: {
          select: {
            id: true,
            appointmentNumber: true,
            appointmentDate: true,
            appointmentTime: true,
            type: true,
            status: true,
            isCheckedIn: true,
            checkedInAt: true,
            reason: true,
            doctor: {
              select: {
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
          orderBy: { appointmentDate: 'desc' },
        },
        // 2. Invoices & Billing History
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            totalAmount: true,
            paidAmount: true,
            outstandingAmount: true,
            status: true,
          },
          orderBy: { issueDate: 'desc' },
        },
        // 3. Payment Receipts History
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            paymentMethod: true,
            referenceNumber: true,
            paidAt: true,
          },
          orderBy: { paidAt: 'desc' },
        },
        // 4. Inpatient Admissions Status
        admissions: {
          select: {
            id: true,
            admissionNumber: true,
            admittedDate: true,
            dischargeDate: true,
            ward: true,
            roomNumber: true,
            bedNumber: true,
            status: true,
            attendingDoctor: true,
          },
          orderBy: { admittedDate: 'desc' },
        },
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    return patient;
  }
}

module.exports = new ReceptionistPatientService();
