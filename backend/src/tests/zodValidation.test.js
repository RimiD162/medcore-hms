const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const doctorValidators = require('../validators/doctorValidators');

describe('Zod Validation Schemas', () => {
  it('should validate valid doctor profile payload', () => {
    const validProfile = {
      fullName: 'Dr. Sarah Chen',
      phone: '+91 98111 22334',
      department: 'Cardiology',
      specialization: 'Consultant Cardiologist',
      licenseNumber: 'MCI-88392',
      consultationFee: 750,
      experienceYears: 12,
      qualifications: ['MBBS', 'MD', 'DM'],
      bio: 'Cardiologist with 12 years experience.',
      roomNumber: 'OPD-102',
      status: 'Available',
    };

    const result = doctorValidators.updateProfileSchema.safeParse(validProfile);
    assert.equal(result.success, true);
  });

  it('should reject invalid doctor profile fee <= 0', () => {
    const invalidProfile = {
      consultationFee: -50,
    };

    const result = doctorValidators.updateProfileSchema.safeParse(invalidProfile);
    assert.equal(result.success, false);
  });

  it('should validate valid availability slot', () => {
    const validAvailability = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00',
      consultationDuration: 15,
      isActive: true,
    };

    const result = doctorValidators.availabilitySchema.safeParse(validAvailability);
    assert.equal(result.success, true);
  });

  it('should reject availability when endTime is before startTime', () => {
    const invalidAvailability = {
      dayOfWeek: 1,
      startTime: '17:00',
      endTime: '09:00',
      consultationDuration: 15,
    };

    const result = doctorValidators.availabilitySchema.safeParse(invalidAvailability);
    assert.equal(result.success, false);
  });

  it('should reject availability when break is outside working hours', () => {
    const invalidBreak = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      breakStartTime: '18:00',
      breakEndTime: '19:00',
      consultationDuration: 15,
    };

    const result = doctorValidators.availabilitySchema.safeParse(invalidBreak);
    assert.equal(result.success, false);
  });

  it('should validate complete consultation payload', () => {
    const validConsultation = {
      chiefComplaint: 'Chest tightness on exertion',
      symptoms: ['Chest Pain', 'Shortness of Breath'],
      vitals: {
        bp: '130/85',
        heartRate: 76,
        temp: 98.6,
        spo2: 99,
        weight: 78,
        height: 175,
      },
      clinicalNotes: 'Normal S1/S2 heard. No murmurs.',
      diagnosis: 'Stable Angina / Exertional Ischemia',
      treatmentPlan: 'Tab. Aspirin 75mg OD, Tab. Atorvastatin 20mg HS',
      doctorNotes: 'Schedule TMT next week',
      followUp: {
        followUpDate: '2026-10-15',
        reason: 'Review TMT reports',
        notes: 'Bring previous ECGs',
      },
    };

    const result = doctorValidators.completeConsultationSchema.safeParse(validConsultation);
    assert.equal(result.success, true);
  });

  it('should validate multi-item prescription schema', () => {
    const validPrescription = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      notes: 'Take after meals',
      items: [
        {
          medicineName: 'Telmisartan 40mg',
          dosage: '40mg',
          frequency: '1-0-0',
          duration: '30 Days',
          route: 'Oral',
          instructions: 'Morning after breakfast',
        },
        {
          medicineName: 'Amlodipine 5mg',
          dosage: '5mg',
          frequency: '0-0-1',
          duration: '30 Days',
          route: 'Oral',
          instructions: 'Bedtime',
        },
      ],
    };

    const result = doctorValidators.createPrescriptionSchema.safeParse(validPrescription);
    assert.equal(result.success, true);
  });
});
