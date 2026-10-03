const http = require('http');

function get(path, token) {
  return new Promise((resolve) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers,
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
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function run() {
  console.log('--- Checking /api/v1/health ---');
  const health = await get('/api/v1/health');
  console.log('Health:', JSON.stringify(health, null, 2));

  console.log('\n--- Checking /api/v1/nurse/profile with demo-nurse-token ---');
  const nurseProf = await get('/api/v1/nurse/profile', 'demo-nurse-token');
  console.log('Nurse Profile:', JSON.stringify(nurseProf, null, 2));

  console.log('\n--- Checking /api/v1/nurse/dashboard with demo-nurse-token ---');
  const nurseDash = await get('/api/v1/nurse/dashboard', 'demo-nurse-token');
  console.log('Nurse Dashboard:', JSON.stringify(nurseDash, null, 2));

  console.log('\n--- Checking /api/v1/nurse/patients with demo-nurse-token ---');
  const nursePatients = await get('/api/v1/nurse/patients', 'demo-nurse-token');
  console.log('Nurse Patients:', JSON.stringify(nursePatients, null, 2));
}

run();
