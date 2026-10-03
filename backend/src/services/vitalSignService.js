const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class VitalSignService {
  /**
   * Helper to determine if vitals are outside standard clinical thresholds
   */
  evaluateThresholds(vitals) {
    const flags = [];
    const sys = vitals.systolic;
    const dia = vitals.diastolic;

    if (sys && dia) {
      if (sys >= 140 || dia >= 90) {
        flags.push('Elevated Blood Pressure (Systolic >= 140 or Diastolic >= 90)');
      } else if (sys < 90 || dia < 60) {
        flags.push('Low Blood Pressure (Systolic < 90 or Diastolic < 60)');
      }
    }

    if (vitals.pulse > 100) {
      flags.push('Elevated Pulse / Tachycardia (> 100 bpm)');
    } else if (vitals.pulse < 60) {
      flags.push('Low Pulse / Bradycardia (< 60 bpm)');
    }

    if (vitals.oxygenSaturation < 95) {
      flags.push('Low Oxygen Saturation (SpO2 < 95%)');
    }

    if (vitals.temperature >= 100.4) {
      flags.push('Elevated Temperature / Fever (>= 100.4°F)');
    } else if (vitals.temperature < 96.0) {
      flags.push('Low Temperature (< 96.0°F)');
    }

    if (vitals.respiratoryRate > 20) {
      flags.push('Elevated Respiratory Rate (> 20 breaths/min)');
    } else if (vitals.respiratoryRate < 12) {
      flags.push('Low Respiratory Rate (< 12 breaths/min)');
    }

    return {
      isFlagged: flags.length > 0,
      flagReason: flags.length > 0 ? flags.join('; ') : null,
    };
  }

  /**
   * Record new vital signs
   */
  async recordVitals(nurseId, payload) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');

    const bpParts = payload.bloodPressure.split('/');
    const systolic = parseInt(bpParts[0], 10);
    const diastolic = parseInt(bpParts[1], 10);

    const evaluation = this.evaluateThresholds({
      systolic,
      diastolic,
      pulse: payload.pulse,
      temperature: payload.temperature,
      respiratoryRate: payload.respiratoryRate,
      oxygenSaturation: payload.oxygenSaturation,
    });

    const vital = await prisma.vitalSign.create({
      data: {
        patientId: payload.patientId,
        nurseId,
        bloodPressure: payload.bloodPressure,
        systolic,
        diastolic,
        temperature: payload.temperature,
        pulse: payload.pulse,
        respiratoryRate: payload.respiratoryRate,
        oxygenSaturation: payload.oxygenSaturation,
        weight: payload.weight || null,
        height: payload.height || null,
        observation: payload.observation || null,
        isFlagged: evaluation.isFlagged,
        flagReason: evaluation.flagReason,
        recordedAt: payload.recordedAt ? new Date(payload.recordedAt) : new Date(),
      },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true },
        },
      },
    });

    return vital;
  }

  /**
   * Get all vitals across nurse's assigned patients or all accessible records
   */
  async getVitals(nurseId, query = {}) {
    const { patientId, isFlagged, limit = 50, page = 1 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (patientId) where.patientId = patientId;
    if (isFlagged === 'true' || isFlagged === true) where.isFlagged = true;

    // Filter to nurse's assigned patients if no specific patient requested
    if (!patientId && nurseId) {
      where.patient = {
        nurseAssignments: {
          some: { nurseId, isActive: true },
        },
      };
    }

    const total = await prisma.vitalSign.count({ where });
    const vitals = await prisma.vitalSign.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: { recordedAt: 'desc' },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true, age: true, gender: true },
        },
      },
    });

    return {
      vitals,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get chronological history of vitals for a specific patient
   */
  async getPatientVitals(patientId) {
    const vitals = await prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
      },
    });

    return vitals;
  }

  /**
   * Correct a vital sign (allowed within 2-hour window by recording nurse)
   */
  async correctVitalSign(nurseId, vitalId, payload) {
    const existing = await prisma.vitalSign.findUnique({
      where: { id: vitalId },
    });

    if (!existing) {
      throw ApiError.notFound('Vital sign record not found');
    }

    if (existing.nurseId !== nurseId) {
      throw ApiError.forbidden('Only the recording nurse may correct this vital sign entry');
    }

    // Check 2-hour edit window
    const hoursSinceRecorded = (Date.now() - new Date(existing.recordedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceRecorded > 2) {
      throw ApiError.badRequest('Vital sign record is locked after 2 hours. Please log a new vital check entry.');
    }

    let systolic = existing.systolic;
    let diastolic = existing.diastolic;
    let bloodPressure = existing.bloodPressure;

    if (payload.bloodPressure) {
      const parts = payload.bloodPressure.split('/');
      systolic = parseInt(parts[0], 10);
      diastolic = parseInt(parts[1], 10);
      bloodPressure = payload.bloodPressure;
    }

    const evaluation = this.evaluateThresholds({
      systolic,
      diastolic,
      pulse: payload.pulse !== undefined ? payload.pulse : existing.pulse,
      temperature: payload.temperature !== undefined ? payload.temperature : existing.temperature,
      respiratoryRate: payload.respiratoryRate !== undefined ? payload.respiratoryRate : existing.respiratoryRate,
      oxygenSaturation: payload.oxygenSaturation !== undefined ? payload.oxygenSaturation : existing.oxygenSaturation,
    });

    const updated = await prisma.vitalSign.update({
      where: { id: vitalId },
      data: {
        bloodPressure,
        systolic,
        diastolic,
        temperature: payload.temperature !== undefined ? payload.temperature : existing.temperature,
        pulse: payload.pulse !== undefined ? payload.pulse : existing.pulse,
        respiratoryRate: payload.respiratoryRate !== undefined ? payload.respiratoryRate : existing.respiratoryRate,
        oxygenSaturation: payload.oxygenSaturation !== undefined ? payload.oxygenSaturation : existing.oxygenSaturation,
        weight: payload.weight !== undefined ? payload.weight : existing.weight,
        height: payload.height !== undefined ? payload.height : existing.height,
        observation: payload.observation !== undefined ? payload.observation : existing.observation,
        isFlagged: evaluation.isFlagged,
        flagReason: evaluation.flagReason,
      },
    });

    return updated;
  }
}

module.exports = new VitalSignService();
