const nurseProfileService = require('../services/nurseProfileService');

async function test() {
  try {
    const res = await nurseProfileService.getProfile('bce620b7-f9e3-4082-bcf9-57e8626f496b', '333e668b-6563-4a69-b9c5-d48c0ac8da4c');
    console.log('Profile res:', res.id, res.user?.fullName);
  } catch (err) {
    console.error('Profile error:', err);
  }
}

test();
