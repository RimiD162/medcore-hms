const http = require('http');

async function get(path, token = 'demo-pharmacist-token') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:5000/api/v1${path}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function testAll() {
  const endpoints = [
    '/pharmacist/dashboard',
    '/pharmacist/medicines',
    '/pharmacist/inventory',
    '/pharmacist/batches',
    '/pharmacist/transactions',
    '/pharmacist/low-stock',
    '/pharmacist/expiry',
    '/pharmacist/prescriptions',
    '/pharmacist/dispensing/history',
    '/pharmacist/sales',
    '/pharmacist/notifications',
    '/pharmacist/profile',
  ];

  console.log('Testing Pharmacist REST API endpoints...');
  let pass = 0;
  for (const ep of endpoints) {
    const res = await get(ep);
    if (res.status === 200 && res.data?.success) {
      console.log(`[PASS] 200 OK -> ${ep}`);
      pass++;
    } else {
      console.error(`[FAIL] ${res.status} -> ${ep}`, res.data || res.raw);
    }
  }

  console.log(`\nEndpoint verification summary: ${pass}/${endpoints.length} passed.`);
  process.exit(pass === endpoints.length ? 0 : 1);
}

testAll();
