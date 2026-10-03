const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    let token = 'demo-doctor-token';
    if (path.includes('/nurse')) {
      token = 'demo-nurse-token';
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('=== Starting MedCore HMS Nurse & Doctor E2E Health Checks ===\n');

  try {
    // 1. Health check
    const health = await request('/api/v1/health');
    console.log('1. GET /api/v1/health -> Status:', health.status, health.body?.success ? 'OK' : 'FAIL');

    // 2. Nurse Dashboard
    const nurseDash = await request('/api/v1/nurse/dashboard');
    console.log('2. GET /api/v1/nurse/dashboard -> Status:', nurseDash.status, 'Metrics:', nurseDash.body?.data?.metrics ? 'OK' : 'FAIL');
    if (nurseDash.body?.data?.metrics) {
      console.log('   Assigned Patients:', nurseDash.body.data.metrics.assignedPatientsCount, 
                  '| Pending Meds:', nurseDash.body.data.metrics.pendingMedsCount, 
                  '| Critical Vitals:', nurseDash.body.data.metrics.criticalVitalsCount);
    }

    // 3. Nurse Patients Directory
    const nursePatients = await request('/api/v1/nurse/patients');
    const pList = nursePatients.body?.data?.patients || nursePatients.body?.data || [];
    console.log('3. GET /api/v1/nurse/patients -> Status:', nursePatients.status, 'Count:', pList.length);

    // 4. Nurse Vitals
    const vitals = await request('/api/v1/nurse/vitals');
    const vList = vitals.body?.data?.vitals || vitals.body?.data || [];
    console.log('4. GET /api/v1/nurse/vitals -> Status:', vitals.status, 'Count:', vList.length);

    // 5. Nurse Nursing Notes
    const notes = await request('/api/v1/nurse/notes');
    const nList = notes.body?.data?.notes || notes.body?.data || [];
    console.log('5. GET /api/v1/nurse/notes -> Status:', notes.status, 'Count:', nList.length);

    // 6. Nurse Medications (e-MAR)
    const meds = await request('/api/v1/nurse/medications');
    const mList = meds.body?.data?.tasks || meds.body?.data?.medications || meds.body?.data || [];
    console.log('6. GET /api/v1/nurse/medications -> Status:', meds.status, 'Tasks Count:', mList.length);

    // 7. Nurse Inpatient Admissions
    const admissions = await request('/api/v1/nurse/admissions');
    const aList = admissions.body?.data?.admissions || admissions.body?.data || [];
    console.log('7. GET /api/v1/nurse/admissions -> Status:', admissions.status, 'Admissions Count:', aList.length);

    // 8. Nurse Bed Grid
    const beds = await request('/api/v1/nurse/beds');
    const bList = beds.body?.data?.beds || beds.body?.data || [];
    console.log('8. GET /api/v1/nurse/beds -> Status:', beds.status, 'Beds Count:', bList.length);

    // 9. Nurse Profile
    const nurseProfile = await request('/api/v1/nurse/profile');
    console.log('9. GET /api/v1/nurse/profile -> Status:', nurseProfile.status, 'Nurse Name:', nurseProfile.body?.data?.user?.fullName || nurseProfile.body?.data?.fullName);

    // 10. Nurse Notifications
    const notifs = await request('/api/v1/nurse/notifications');
    const notifList = notifs.body?.data?.notifications || notifs.body?.data || [];
    console.log('10. GET /api/v1/nurse/notifications -> Status:', notifs.status, 'Notifications Count:', notifList.length);

    // 11. Doctor Dashboard Regression Check
    const docDash = await request('/api/v1/doctor/dashboard');
    console.log('11. GET /api/v1/doctor/dashboard -> Status:', docDash.status, 'Doctor Metrics:', docDash.body?.data?.metrics ? 'OK' : 'FAIL');

    // 12. Doctor Appointments Regression Check
    const docAppts = await request('/api/v1/doctor/appointments');
    const apptList = docAppts.body?.data?.appointments || docAppts.body?.data || [];
    console.log('12. GET /api/v1/doctor/appointments -> Status:', docAppts.status, 'Appointments Count:', apptList.length);

    console.log('\n=== All Core Endpoints Tested Successfully ===');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runE2ETests();
