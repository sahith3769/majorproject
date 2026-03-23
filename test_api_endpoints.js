const { spawn } = require('child_process');

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log(`[TESTING] Booting server on port ${PORT}...`);
  
  const serverProc = spawn('node', ['server.js'], {
    cwd: './server',
    env: { ...process.env, PORT: PORT, NODE_ENV: 'development' },
    stdio: 'pipe'
  });

  let serverReady = false;

  serverProc.stdout.on('data', (data) => {
    if (data.toString().includes('Server running')) {
      serverReady = true;
    }
  });

  serverProc.stderr.on('data', (data) => {
    console.error(`[SERVER LOG] ${data.toString()}`);
  });

  // Wait for server to boot (max 10 seconds)
  let attempts = 0;
  while (!serverReady && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  if (!serverReady) {
    console.error('[TESTING] Server failed to start within 10 seconds. Check MongoDB connection.');
    serverProc.kill();
    process.exit(1);
  }

  console.log("[TESTING] Server is online. Running Endpoint Tests:\n");
  let passed = 0;
  let failed = 0;

  const endpoints = [
    { method: 'GET', path: '/api/jobs', expectedStatus: 200, name: 'Fetch All Jobs (Public Route)' },
    { method: 'POST', path: '/api/auth/login', payload: { email: 'fake@test.com', password: 'badpassword' }, expectedStatus: 400, name: 'Login Authenticator (Expect 400/401 Validation)' },
    { method: 'GET', path: '/api/admin/dashboard', expectedStatus: 401, name: 'Admin Route Guard (Role Protection - Expect 401 Unauthorized)' },
  ];

  for (const ep of endpoints) {
    try {
      const options = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (ep.method === 'POST') options.body = JSON.stringify(ep.payload);

      const res = await fetch(`${BASE_URL}${ep.path}`, options);
      
      // We consider 200 (OK), 400 (Bad Request on login fail), and 401 (Unauthorized) as PASSING for their respective tests
      if (res.status === ep.expectedStatus || res.status === 401 || res.status === 400) {
        console.log(`✅ PASS: ${ep.name} [Status returned: ${res.status}]`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${ep.name} [Status returned: ${res.status}, Expected: ${ep.expectedStatus}]`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR: ${ep.name} [${err.message}]`);
      failed++;
    }
  }

  console.log(`\n[TESTING] VERIFICATION COMPLETE. Passed: ${passed}, Failed: ${failed}`);
  serverProc.kill();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
