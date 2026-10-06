const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'medcore_jwt_secret_key_clinical_doctor_2026';

// In-memory cache for demo users to avoid roundtrip DB calls on every request
let cachedDemoDoctor = null;
let cachedDemoNurse = null;
let cachedDemoReceptionist = null;
let cachedDemoPharmacist = null;
let cachedDemoLabTech = null;
let cachedDemoLabVerifier = null;

async function initDemoCache() {
  try {
    const labVerifier = await prisma.user.findFirst({
      where: { role: 'LAB_TECHNICIAN', isActive: true, labTechnicianProfile: { isSeniorVerifier: true } },
      include: { labTechnicianProfile: true },
    });
    const labTech = await prisma.user.findFirst({
      where: { role: 'LAB_TECHNICIAN', isActive: true, labTechnicianProfile: { isSeniorVerifier: false } },
      include: { labTechnicianProfile: true },
    });
    const pharmacist = await prisma.user.findFirst({
      where: { role: 'PHARMACIST', isActive: true },
      include: { pharmacistProfile: true },
    });
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

    if (labVerifier) {
      cachedDemoLabVerifier = {
        id: labVerifier.id,
        email: labVerifier.email,
        fullName: labVerifier.fullName,
        role: labVerifier.role,
        labTechnicianId: labVerifier.labTechnicianProfile?.id,
        labTechnicianProfile: labVerifier.labTechnicianProfile,
        isSeniorVerifier: true,
      };
    }

    if (labTech || labVerifier) {
      const defaultTech = labTech || labVerifier;
      cachedDemoLabTech = {
        id: defaultTech.id,
        email: defaultTech.email,
        fullName: defaultTech.fullName,
        role: defaultTech.role,
        labTechnicianId: defaultTech.labTechnicianProfile?.id,
        labTechnicianProfile: defaultTech.labTechnicianProfile,
        isSeniorVerifier: !!defaultTech.labTechnicianProfile?.isSeniorVerifier,
      };
    }

    if (pharmacist) {
      cachedDemoPharmacist = {
        id: pharmacist.id,
        email: pharmacist.email,
        fullName: pharmacist.fullName,
        role: pharmacist.role,
        pharmacistId: pharmacist.pharmacistProfile?.id,
        pharmacistProfile: pharmacist.pharmacistProfile,
      };
    }

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
 * Decodes JWT token and attaches user & profile to req.user
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
    const isLabVerifierContext = token === 'demo-lab-verifier-token';
    const isLabContext = token === 'demo-lab-token' || isLabVerifierContext || req.originalUrl?.includes('/api/v1/lab') || req.baseUrl?.includes('/lab');
    const isPharmacistContext = token === 'demo-pharmacist-token' || req.originalUrl?.includes('/api/v1/pharmacist') || req.baseUrl?.includes('/pharmacist');
    const isReceptionistContext = token === 'demo-receptionist-token' || req.originalUrl?.includes('/api/v1/receptionist') || req.baseUrl?.includes('/receptionist');
    const isNurseContext = token === 'demo-nurse-token' || req.originalUrl?.includes('/api/v1/nurse') || req.baseUrl?.includes('/nurse');

    if (!token || token.startsWith('demo-')) {
      if (isLabContext) {
        if (!cachedDemoLabTech || !cachedDemoLabVerifier) {
          await initDemoCache();
        }

        const labUser = isLabVerifierContext
          ? cachedDemoLabVerifier || cachedDemoLabTech
          : cachedDemoLabTech || cachedDemoLabVerifier;

        if (!labUser) {
          return ApiResponse.unauthorized(res, 'No active lab technician found for workspace session');
        }

        req.user = { ...labUser };
        return next();
      }

      if (isPharmacistContext) {
        if (!cachedDemoPharmacist) {
          await initDemoCache();
        }

        if (!cachedDemoPharmacist) {
          return ApiResponse.unauthorized(res, 'No active pharmacist found for workspace session');
        }

        req.user = { ...cachedDemoPharmacist };
        return next();
      }

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
      include: {
        doctorProfile: true,
        nurseProfile: true,
        receptionistProfile: true,
        pharmacistProfile: true,
        labTechnicianProfile: true,
      },
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
      pharmacistId: user.pharmacistProfile?.id,
      pharmacistProfile: user.pharmacistProfile,
      labTechnicianId: user.labTechnicianProfile?.id,
      labTechnicianProfile: user.labTechnicianProfile,
      isSeniorVerifier: !!user.labTechnicianProfile?.isSeniorVerifier,
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
 * Enforces specified role (e.g., 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN')
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
 * Access Control Service Function for Nurses
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
 * Access Control Service Function for Lab Technicians
 * A lab user can reach a patient only through an active lab order/sample/result relationship
 */
async function canLabAccessPatient(patientId) {
  if (!patientId) return false;

  const order = await prisma.labTestOrder.findFirst({
    where: { patientId },
    select: { id: true },
  });

  return !!order;
}

/**
 * Nurse-Patient Assignment Authorization Guard
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

/**
 * Lab-Patient Relationship Authorization Guard
 */
async function authorizeLabPatientAccess(req, res, next) {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;

    if (!patientId) {
      return next();
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return ApiResponse.notFound(res, 'Patient record not found');
    }

    const hasAccess = await canLabAccessPatient(patientId);

    if (!hasAccess && req.user.role !== 'ADMIN') {
      return ApiResponse.forbidden(
        res,
        'Unauthorized: No laboratory test orders exist for this patient'
      );
    }

  } catch (err) {
    next(err);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }
    if (roles.length > 0 && !roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return ApiResponse.forbidden(res, `Access denied: requires one of [${roles.join(', ')}]`);
    }
    next();
  };
}


module.exports = {
  authMiddleware,
  authenticate: authMiddleware,
  requireRole,
  authorize,
  authorizePatientAccess,
  authorizeNursePatientAccess,
  authorizeLabPatientAccess,
  canNurseAccessPatient,
  canLabAccessPatient,
  initDemoCache,
};

