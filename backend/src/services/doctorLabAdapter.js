/**
 * Doctor Module Laboratory Compatibility Adapter
 * Maps rich diagnostic lifecycle state to Doctor workspace expectations
 */

function mapToDoctorLabStatus(internalStatus) {
  switch (internalStatus) {
    case 'ORDERED':
    case 'PENDING':
    case 'PENDING_COLLECTION':
      return 'ORDERED';
    case 'COLLECTED':
    case 'SAMPLE_COLLECTED':
    case 'IN_TRANSIT':
      return 'SAMPLE_COLLECTED';
    case 'RECEIVED_IN_LAB':
    case 'PROCESSING':
    case 'RESULTS_ENTERED':
      return 'PROCESSING';
    case 'VERIFIED':
    case 'COMPLETED':
    case 'RELEASED':
    case 'AMENDED':
      return 'COMPLETED';
    case 'CANCELLED':
    case 'REJECTED':
      return 'CANCELLED';
    default:
      return 'ORDERED';
  }
}

module.exports = {
  mapToDoctorLabStatus,
};
