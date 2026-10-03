const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'medcore_jwt_secret_key_clinical_doctor_2026';

/**
 * Authentication Middleware
 * Decodes JWT token and attaches user & doctorProfile to req.user
 */
async function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // ── Placeholder / Demo Fallback ──
    // If no token provided in development/demo, default to primary doctor Dr. Sarah Chen
    // TODO Phase 1: connect real authenticated user in production
    if (!token || token === 'demo-doctor-token') {
      const defaultDoctor = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true },
        include: { doctorProfile: true },
      });

      if (!defaultDoctor) {
        return ApiResponse.unauthorized(res, 'No active doctor found for workspace session');
      }

      req.user = {
        id: defaultDoctor.id,
        email: defaultDoctor.email,
        fullName: defaultDoctor.fullName,
        role: defaultDoctor.role,
        doctorId: defaultDoctor.doctorProfile?.id,
        doctorProfile: defaultDoctor.doctorProfile,
      };

      return next();
    }

    // Verify JWT Token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: { doctorProfile: true },
    });

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'User session has expired or is deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      doctorId: user.doctorProfile?.id,
      doctorProfile: user.doctorProfile,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Invalid or expired session token');
    }
    return next(err);
  }
}

/**
 * Role-based Authorization Middleware
 * Enforces specified role (e.g., 'DOCTOR')
 */
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      return ApiResponse.forbidden(
        res,
        `Access denied: requires ${requiredRole} role privileges`
      );
    }

    next();
  };
}

/**
 * Doctor-Patient Relationship & Resource Authorization Guard
 * Ensures doctor only accesses patients with whom they have an appointment or clinical record
 */
async function authorizePatientAccess(req, res, next) {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    const doctorId = req.user.doctorId;

    if (!patientId || !doctorId) {
      return next();
    }

    // Verify if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return ApiResponse.notFound(res, 'Patient record not found');
    }

    // Check if doctor has an appointment or consultation or medical record with this patient
    const relationshipExists = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId,
      },
    });

    if (!relationshipExists && req.user.role !== 'ADMIN') {
      // Also check medical records or consultations
      const recordExists = await prisma.medicalRecord.findFirst({
        where: { patientId, doctorId },
      });

      if (!recordExists) {
        return ApiResponse.forbidden(
          res,
          'Unauthorized: You do not have an active clinical relationship with this patient'
        );
      }
    }

    req.patient = patient;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authMiddleware,
  requireRole,
  authorizePatientAccess,
};
