const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const ALLOWED_TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

function canTransition(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

describe('Appointment State Machine', () => {
  it('should allow SCHEDULED to transition to CONFIRMED, CANCELLED, NO_SHOW', () => {
    assert.equal(canTransition('SCHEDULED', 'CONFIRMED'), true);
    assert.equal(canTransition('SCHEDULED', 'CANCELLED'), true);
    assert.equal(canTransition('SCHEDULED', 'NO_SHOW'), true);
    assert.equal(canTransition('SCHEDULED', 'COMPLETED'), false); // Cannot jump straight to COMPLETED without confirmation
  });

  it('should allow CONFIRMED to transition to COMPLETED, CANCELLED, NO_SHOW', () => {
    assert.equal(canTransition('CONFIRMED', 'COMPLETED'), true);
    assert.equal(canTransition('CONFIRMED', 'CANCELLED'), true);
    assert.equal(canTransition('CONFIRMED', 'NO_SHOW'), true);
    assert.equal(canTransition('CONFIRMED', 'SCHEDULED'), false);
  });

  it('should treat COMPLETED as terminal', () => {
    assert.equal(canTransition('COMPLETED', 'SCHEDULED'), false);
    assert.equal(canTransition('COMPLETED', 'CONFIRMED'), false);
    assert.equal(canTransition('COMPLETED', 'CANCELLED'), false);
  });

  it('should treat CANCELLED as terminal', () => {
    assert.equal(canTransition('CANCELLED', 'SCHEDULED'), false);
    assert.equal(canTransition('CANCELLED', 'CONFIRMED'), false);
  });

  it('should treat NO_SHOW as terminal', () => {
    assert.equal(canTransition('NO_SHOW', 'SCHEDULED'), false);
    assert.equal(canTransition('NO_SHOW', 'COMPLETED'), false);
  });
});
