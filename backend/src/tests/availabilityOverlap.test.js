const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function hasScheduleOverlap(existingSchedules, newStart, newEnd) {
  const newStartMin = timeToMinutes(newStart);
  const newEndMin = timeToMinutes(newEnd);

  for (const schedule of existingSchedules) {
    const existStartMin = timeToMinutes(schedule.startTime);
    const existEndMin = timeToMinutes(schedule.endTime);

    // Overlap: (StartA < EndB) and (EndA > StartB)
    if (newStartMin < existEndMin && newEndMin > existStartMin) {
      return true;
    }
  }
  return false;
}

describe('Doctor Availability Overlap Validation', () => {
  const existing = [
    { startTime: '09:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '17:00' },
  ];

  it('should detect direct overlap inside existing slot', () => {
    assert.equal(hasScheduleOverlap(existing, '10:00', '11:00'), true);
  });

  it('should detect partial overlap across start boundary', () => {
    assert.equal(hasScheduleOverlap(existing, '08:30', '09:30'), true);
  });

  it('should detect partial overlap across end boundary', () => {
    assert.equal(hasScheduleOverlap(existing, '11:30', '12:30'), true);
  });

  it('should detect enclosing overlap', () => {
    assert.equal(hasScheduleOverlap(existing, '08:00', '13:00'), true);
  });

  it('should allow non-overlapping slot in break period (12:00 to 14:00)', () => {
    assert.equal(hasScheduleOverlap(existing, '12:00', '14:00'), false);
  });

  it('should allow non-overlapping evening slot', () => {
    assert.equal(hasScheduleOverlap(existing, '17:30', '20:00'), false);
  });
});
