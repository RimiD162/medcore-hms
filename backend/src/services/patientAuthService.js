const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const portalConfig = require('../config/portalConfig');
const PatientPortalMapper = require('../utils/PatientPortalMapper');

const JWT_SECRET = process.env.JWT_SECRET || 'medcore_jwt_secret_key_clinical_doctor_2026';

class PatientAuthService {
  /**
   * Helper to generate a signed JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Activate Portal Account using Front-Desk issued Invite Code
   */
  async activatePortalAccount({ inviteCode, email, password }) {
    if (!inviteCode || !email || !password) {
      throw ApiError.badRequest('Invite code, email, and password are required');
    }

    const cleanCode = String(inviteCode).trim();
    const cleanEmail = String(email).toLowerCase().trim();

    // 1. Locate invite
    const invite = await prisma.portalInvite.findUnique({
      where: { inviteCode: cleanCode },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });

    if (!invite) {
      throw ApiError.badRequest('Invalid invitation code. Please check your code or contact the hospital front desk.');
    }

    if (invite.attemptsCount >= portalConfig.maxInviteAttempts) {
      throw ApiError.badRequest(
        'This invitation has been locked due to too many invalid verification attempts. Please contact the front desk for a new invite.'
      );
    }

    if (invite.isRedeemed) {
      throw ApiError.badRequest('This invitation has already been redeemed. Please sign in with your email and password.');
    }

    if (new Date() > new Date(invite.expiresAt)) {
      throw ApiError.badRequest('This invitation code has expired. Please request a new invite from the hospital front desk.');
    }

    // 2. Verify email matches the invited patient email
    if (invite.email.toLowerCase().trim() !== cleanEmail) {
      await prisma.portalInvite.update({
        where: { id: invite.id },
        data: { attemptsCount: { increment: 1 } },
      });
      throw ApiError.badRequest('The provided email does not match the invitation record.');
    }

    // 3. Verify patient does not already have a linked user account
    if (invite.patient.userId || invite.patient.user) {
      throw ApiError.badRequest('This patient already has an active portal account linked.');
    }

    // 4. Verify no user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw ApiError.badRequest('An account with this email address already exists.');
    }

    // 5. Atomic Transaction: Create User, link Patient, redeem invite
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          fullName: invite.patient.fullName,
          role: 'PATIENT',
          isActive: true,
          isVerified: true,
          lastLoginAt: new Date(),
        },
      });

      const updatedPatient = await tx.patient.update({
        where: { id: invite.patientId },
        data: {
          userId: user.id,
          email: cleanEmail,
        },
      });

      await tx.portalInvite.update({
        where: { id: invite.id },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
      });

      // Welcome Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to MedCore HMS Patient Portal',
          message: 'Your patient portal account is now active. You can view appointments, medical records, prescriptions, and billing statements.',
          type: 'INFO',
          isRead: false,
        },
      });

      return { user, patient: updatedPatient };
    });

    const token = this.generateToken(result.user);
    const profileDTO = PatientPortalMapper.toPatientProfileDTO(result.patient, result.user);

    return {
      user: profileDTO,
      token,
      message: 'Portal account successfully activated',
    };
  }

  /**
   * Patient Login
   */
  async patientLogin({ email, password }) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        patient: true,
      },
    });

    if (!user || user.role !== 'PATIENT') {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact the hospital front desk.');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const patient = user.patient || await prisma.patient.findFirst({ where: { userId: user.id } });

    if (!patient) {
      throw ApiError.forbidden('No active patient record linked to this account.');
    }

    const token = this.generateToken(user);
    const profileDTO = PatientPortalMapper.toPatientProfileDTO(patient, user);

    return {
      user: profileDTO,
      token,
      message: 'Login successful',
    };
  }

  /**
   * Register Patient (Self-service if enabled, otherwise honest fallback)
   */
  async registerPatient(data) {
    if (!portalConfig.patientSelfRegistrationEnabled) {
      throw ApiError.badRequest(
        'Self-registration is currently disabled. Please contact or visit the hospital front desk to receive a secure portal invitation.'
      );
    }

    // If enabled in future configuration:
    throw ApiError.badRequest('Self-service registration requires in-person identity verification at the front desk.');
  }

  /**
   * Forgot Password Guidance
   */
  async forgotPassword(email) {
    return {
      message:
        'MedCore HMS uses secure in-person credential management. Please visit or contact the hospital front desk with your Patient ID to verify your identity and receive a secure password reset link or temporary access code.',
      supportContact: 'frontdesk@medcore.health',
      supportPhone: '+91 (080) 4567-8900',
    };
  }

  /**
   * Change Password (Authenticated Patient)
   */
  async changePassword({ userId, currentPassword, newPassword }) {
    if (!userId || !currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      message: 'Password changed successfully',
    };
  }
}

module.exports = new PatientAuthService();
