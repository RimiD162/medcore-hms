const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    let token = options.token || 'demo-nurse-token';
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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
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

async function testMutations() {
  console.log('=== Starting MedCore HMS Nurse Mutation & Workflow Tests ===\n');

  try {
    // 1. Get assigned patients to get a patient ID
    const patientsRes = await request('/api/v1/nurse/patients');
    const patient = patientsRes.body?.data?.patients?.[0];
    if (!patient) throw new Error('No patient found in seed');
    console.log('Using test patient:', patient.fullName, `(${patient.id})`);

    // 2. Record new Vitals
    console.log('\n--- 1. Testing Record Vitals ---');
    const vitalsPayload = {
      patientId: patient.id,
      bloodPressure: '122/82',
      pulse: 78,
      temperature: 98.7,
      oxygenSaturation: 98,
      respiratoryRate: 18,
      painScore: 2,
      bloodSugar: 110,
      notes: 'Routine evening clinical vitals recorded by Charge Nurse.'
    };
    const vitalsRes = await request('/api/v1/nurse/vitals', { method: 'POST', body: vitalsPayload });
    console.log('Record Vitals -> Status:', vitalsRes.status, 'ID:', vitalsRes.body?.data?.id, 'isFlagged:', vitalsRes.body?.data?.isFlagged);

    // 3. Create Nursing Clinical Note
    console.log('\n--- 2. Testing Create Nursing Note ---');
    const notePayload = {
      patientId: patient.id,
      shift: 'Day Shift (08:00 - 16:00)',
      observation: 'Patient resting comfortably in semi-Fowler position. No signs of acute distress.',
      careProvided: 'Assisted with prescribed evening nebulization therapy and fluid intake.',
      patientResponse: 'Reported improved airway clearance, breathing comfortably at room air.',
      additionalNotes: 'Next vitals check scheduled for 22:00.',
      isFlagged: false
    };
    const noteRes = await request('/api/v1/nurse/notes', { method: 'POST', body: notePayload });
    console.log('Create Note -> Status:', noteRes.status, 'ID:', noteRes.body?.data?.id);

    // 4. Test e-MAR Medication Administration
    console.log('\n--- 3. Testing e-MAR Medication Administration Flow ---');
    const medsRes = await request('/api/v1/nurse/medications');
    const tasks = medsRes.body?.data?.tasks || medsRes.body?.data?.medications || [];
    const pendingTask = tasks.find(t => t.status === 'SCHEDULED' || t.status === 'DUE');
    if (pendingTask) {
      console.log('Administering pending medication:', pendingTask.medicineName, `(${pendingTask.id})`);
      const adminRes = await request(`/api/v1/nurse/medications/${pendingTask.id}/administer`, {
        method: 'POST',
        body: { notes: 'Administered with water as prescribed. Patient tolerated well.' }
      });
      console.log('Administer Medication -> Status:', adminRes.status, 'New Status:', adminRes.body?.data?.status);
    } else {
      console.log('No SCHEDULED task available, found:', tasks.map(t => `${t.medicineName}:${t.status}`));
    }

    // 5. Test Bed Status Update
    console.log('\n--- 4. Testing Bed Allocation Update ---');
    const bedsRes = await request('/api/v1/nurse/beds');
    const beds = bedsRes.body?.data?.beds || [];
    const bedToUpdate = beds[0];
    if (bedToUpdate) {
      console.log('Updating bed status for:', bedToUpdate.bedNumber, `(${bedToUpdate.id})`);
      const updateBedRes = await request(`/api/v1/nurse/beds/${bedToUpdate.id}/status`, {
        method: 'PATCH',
        body: { status: bedToUpdate.status, notes: 'Bed sanitized and inspected during nursing rounds.' }
      });
      console.log('Update Bed Status -> Status:', updateBedRes.status, 'Updated Bed Status:', updateBedRes.body?.data?.status);
    }

    // 6. Test Negative Authorization Check
    console.log('\n--- 5. Testing Authorization Control & Boundaries ---');
    const unauthorizedRes = await request('/api/v1/nurse/patients/00000000-0000-0000-0000-000000000000');
    console.log('Access unassigned patient -> Status:', unauthorizedRes.status, unauthorizedRes.status === 403 || unauthorizedRes.status === 404 ? 'PASSED (Protected)' : 'UNEXPECTED');

    console.log('\n=== All Workflow & Mutation Tests Completed Successfully ===');
  } catch (err) {
    console.error('Mutation test failed:', err);
  }
}

testMutations();
