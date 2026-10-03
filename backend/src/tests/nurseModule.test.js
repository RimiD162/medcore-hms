const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const nurseValidators = require('../validators/nurseValidators');
const vitalSignService = require('../services/vitalSignService');

describe('Nurse Module — Validation & Clinical Rules', () => {
  describe('Vital Signs Zod Validation', () => {
    it('should validate normal vital signs payload', () => {
      const validVitals = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 98.6,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 70,
        height: 172,
        observation: 'Patient is resting comfortably, no distress',
      };

      const result = nurseValidators.vitalSignsSchema.safeParse(validVitals);
      assert.equal(result.success, true);
    });

    it('should reject physiologically impossible temperature (< 70°F or > 115°F)', () => {
      const tooLow = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 65.0,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooLow).success, false);

      const tooHigh = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 120.0,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooHigh).success, false);
    });

    it('should reject physiologically impossible pulse (< 20 bpm or > 300 bpm)', () => {
      const tooLow = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 98.6,
        pulse: 10,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooLow).success, false);

      const tooHigh = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 98.6,
        pulse: 350,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooHigh).success, false);
    });

    it('should reject impossible SpO2 (< 50% or > 100%)', () => {
      const tooLow = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 98.6,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 40,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooLow).success, false);

      const tooHigh = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '120/80',
        temperature: 98.6,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 105,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(tooHigh).success, false);
    });

    it('should reject invalid Blood Pressure where systolic <= diastolic', () => {
      const invertedBP = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        bloodPressure: '80/120',
        temperature: 98.6,
        pulse: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      };
      assert.equal(nurseValidators.vitalSignsSchema.safeParse(invertedBP).success, false);
    });
  });

  describe('Clinical Thresholds Evaluation', () => {
    it('should flag elevated blood pressure >= 140/90', () => {
      const evalResult = vitalSignService.evaluateThresholds({
        systolic: 150,
        diastolic: 95,
        pulse: 75,
        temperature: 98.6,
        respiratoryRate: 16,
        oxygenSaturation: 98,
      });

      assert.equal(evalResult.isFlagged, true);
      assert.match(evalResult.flagReason, /Elevated Blood Pressure/);
    });

    it('should flag hypoxia when SpO2 < 95%', () => {
      const evalResult = vitalSignService.evaluateThresholds({
        systolic: 120,
        diastolic: 80,
        pulse: 75,
        temperature: 98.6,
        respiratoryRate: 16,
        oxygenSaturation: 91,
      });

      assert.equal(evalResult.isFlagged, true);
      assert.match(evalResult.flagReason, /Low Oxygen Saturation/);
    });

    it('should flag fever when temperature >= 100.4°F', () => {
      const evalResult = vitalSignService.evaluateThresholds({
        systolic: 120,
        diastolic: 80,
        pulse: 88,
        temperature: 101.5,
        respiratoryRate: 18,
        oxygenSaturation: 98,
      });

      assert.equal(evalResult.isFlagged, true);
      assert.match(evalResult.flagReason, /Elevated Temperature \/ Fever/);
    });

    it('should not flag completely normal vitals', () => {
      const evalResult = vitalSignService.evaluateThresholds({
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        temperature: 98.4,
        respiratoryRate: 16,
        oxygenSaturation: 99,
      });

      assert.equal(evalResult.isFlagged, false);
      assert.equal(evalResult.flagReason, null);
    });
  });

  describe('Nursing Notes Validation', () => {
    it('should validate complete clinical nursing note', () => {
      const validNote = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        shift: 'Morning Shift (07:00 - 15:00)',
        observation: 'Patient is conscious, alert, oriented x 3. Surgical wound dressing clean and dry.',
        careProvided: 'Assisted with morning ambulation and administered scheduled IV antibiotics.',
        patientResponse: 'Patient expressed pain reduction (VAS 2/10). Tolerating oral fluids well.',
        additionalNotes: 'Family visited at 10:30 AM.',
        isFlagged: false,
      };

      const result = nurseValidators.nursingNoteSchema.safeParse(validNote);
      assert.equal(result.success, true);
    });

    it('should reject nursing note with missing required clinical fields', () => {
      const incompleteNote = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        observation: 'Patient resting',
        // missing careProvided and patientResponse
      };

      const result = nurseValidators.nursingNoteSchema.safeParse(incompleteNote);
      assert.equal(result.success, false);
    });
  });

  describe('Medication Administration Validation & State Transitions', () => {
    it('should require reason when holding medication', () => {
      const holdWithoutReason = { notes: 'Patient refused' };
      assert.equal(nurseValidators.holdMedicationSchema.safeParse(holdWithoutReason).success, false);

      const holdWithReason = { reason: 'Patient NPO for scheduled surgery at 2 PM', notes: 'Informed doctor' };
      assert.equal(nurseValidators.holdMedicationSchema.safeParse(holdWithReason).success, true);
    });

    it('should require reason when marking medication as missed', () => {
      const missWithoutReason = {};
      assert.equal(nurseValidators.missMedicationSchema.safeParse(missWithoutReason).success, false);

      const missWithReason = { reason: 'Patient was undergoing MRI scan during scheduled window' };
      assert.equal(nurseValidators.missMedicationSchema.safeParse(missWithReason).success, true);
    });

    it('should enforce role immutability in nurse profile update', () => {
      const maliciousPayload = {
        phone: '+91 98765 43210',
        role: 'ADMIN',
      };
      assert.equal(nurseValidators.updateNurseProfileSchema.safeParse(maliciousPayload).success, false);

      const validUpdate = {
        phone: '+91 98765 43210',
        bio: 'Senior charge nurse specialized in critical care and cardiac rehabilitation.',
      };
      assert.equal(nurseValidators.updateNurseProfileSchema.safeParse(validUpdate).success, true);
    });
  });
});
