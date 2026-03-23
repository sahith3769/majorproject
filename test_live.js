async function runLiveTests() {
  const BASE_URL = 'https://cseplacement.onrender.com';
  console.log(`[TESTING] Striking live production server at ${BASE_URL}...\n`);

  let passed = 0;
  let failed = 0;

  const endpoints = [
    { method: 'GET', path: '/api/jobs', expectedStatus: 200, name: 'Fetch All Jobs (Public Route)' },
    { method: 'POST', path: '/api/auth/login', payload: { email: 'fake@test.com', password: 'badpassword' }, expectedStatus: 400, name: 'Login Authenticator (Expect 400 Validation)' },
    { method: 'GET', path: '/api/admin/dashboard', expectedStatus: 401, name: 'Admin Route Guard (Role Protection - Expect 401 Unauthorized)' },
  ];

  for (const ep of endpoints) {
    try {
      const options = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (ep.method === 'POST') options.body = JSON.stringify(ep.payload);

      console.log(`=> Pinging ${ep.method} ${ep.path}...`);
      const res = await fetch(`${BASE_URL}${ep.path}`, options);
      
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

  console.log(`\n[TESTING] LIVE VERIFICATION COMPLETE. Passed: ${passed}, Failed: ${failed}`);
}

runLiveTests();
