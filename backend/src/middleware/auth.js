const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'medcore_jwt_secret_key_clinical_doctor_2026';

// In-memory cache for demo users to avoid roundtrip DB calls on every request
let cachedDemoDoctor = null;
let cachedDemoNurse = null;
let cachedDemoReceptionist = null;

async function initDemoCache() {
  try {
    const receptionist = await prisma.user.findFirst({
      where: { role: 'RECEPTIONIST', isActive: true },
      include: { receptionistProfile: true },
    });
    const nurse = await prisma.user.findFirst({
      where: { role: 'NURSE', isActive: true },
      include: { nurseProfile: true },
    });
    const doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR', isActive: true },
      include: { doctorProfile: true },
    });

    if (receptionist) {
      cachedDemoReceptionist = {
        id: receptionist.id,
        email: receptionist.email,
        fullName: receptionist.fullName,
        role: receptionist.role,
        receptionistId: receptionist.receptionistProfile?.id,
        receptionistProfile: receptionist.receptionistProfile,
      };
    }

    if (nurse) {
      cachedDemoNurse = {
        id: nurse.id,
        email: nurse.email,
        fullName: nurse.fullName,
        role: nurse.role,
        nurseId: nurse.nurseProfile?.id,
        nurseProfile: nurse.nurseProfile,
      };
    }

    if (doctor) {
      cachedDemoDoctor = {
        id: doctor.id,
        email: doctor.email,
        fullName: doctor.fullName,
        role: doctor.role,
        doctorId: doctor.doctorProfile?.id,
        doctorProfile: doctor.doctorProfile,
      };
    }
  } catch (err) {
    console.warn('⚠️ Warning: Demo auth cache initialization deferred:', err.message);
  }
}

/**
 * Authentication Middleware
 * Decodes JWT token and attaches user, doctorProfile, nurseProfile, or receptionistProfile to req.user
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
    // In demo mode or if no token provided, resolve role context based on route prefix or token
    // TODO Phase 1: connect real authenticated user in production
    const isReceptionistContext = token === 'demo-receptionist-token' || req.originalUrl?.includes('/api/v1/receptionist') || req.baseUrl?.includes('/receptionist');
    const isNurseContext = token === 'demo-nurse-token' || req.originalUrl?.includes('/api/v1/nurse') || req.baseUrl?.includes('/nurse');

    if (!token || token === 'demo-doctor-token' || token === 'demo-nurse-token' || token === 'demo-receptionist-token') {
      if (isReceptionistContext) {
        if (!cachedDemoReceptionist) {
          await initDemoCache();
        }

        if (!cachedDemoReceptionist) {
          return ApiResponse.unauthorized(res, 'No active receptionist found for workspace session');
        }

        req.user = { ...cachedDemoReceptionist };
        return next();
      }

      if (isNurseContext) {
        if (!cachedDemoNurse) {
          await initDemoCache();
        }

        if (!cachedDemoNurse) {
          return ApiResponse.unauthorized(res, 'No active nurse found for workspace session');
        }

        req.user = { ...cachedDemoNurse };
        return next();
      }

      // Default to Doctor
      if (!cachedDemoDoctor) {
        await initDemoCache();
      }

      if (!cachedDemoDoctor) {
        return ApiResponse.unauthorized(res, 'No active doctor found for workspace session');
      }

      req.user = { ...cachedDemoDoctor };
      return next();
    }

    // Verify JWT Token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: { doctorProfile: true, nurseProfile: true, receptionistProfile: true },
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
      nurseId: user.nurseProfile?.id,
      nurseProfile: user.nurseProfile,
      receptionistId: user.receptionistProfile?.id,
      receptionistProfile: user.receptionistProfile,
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
 * Enforces specified role (e.g., 'DOCTOR', 'NURSE', 'RECEPTIONIST')
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
 */
async function authorizePatientAccess(req, res, next) {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    const doctorId = req.user.doctorId;

    if (!patientId || !doctorId) {
      return next();
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return ApiResponse.notFound(res, 'Patient record not found');
    }

    const relationshipExists = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId,
      },
    });

    if (!relationshipExists && req.user.role !== 'ADMIN') {
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

/**
 * Access Control Service Function
 * Checks whether a nurse is actively assigned to a patient
 */
async function canNurseAccessPatient(nurseId, patientId) {
  if (!nurseId || !patientId) return false;

  const assignment = await prisma.nurseAssignment.findFirst({
    where: {
      nurseId,
      patientId,
      isActive: true,
    },
  });

  return !!assignment;
}

/**
 * Nurse-Patient Assignment Authorization Guard
 * Ensures nurse only accesses assigned patients
 */
async function authorizeNursePatientAccess(req, res, next) {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    const nurseId = req.user?.nurseId;

    if (!patientId) {
      return next();
    }

    if (!nurseId) {
      return ApiResponse.forbidden(res, 'Access denied: Active nurse profile required');
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return ApiResponse.notFound(res, 'Patient record not found');
    }

    const isAssigned = await canNurseAccessPatient(nurseId, patientId);

    if (!isAssigned && req.user.role !== 'ADMIN') {
      return ApiResponse.forbidden(
        res,
        'Unauthorized: You are not assigned to this patient'
      );
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
  authorizeNursePatientAccess,
  canNurseAccessPatient,
  initDemoCache,
};
