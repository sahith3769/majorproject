const { execSync } = require('child_process');
try {
  console.log("Starting server tests...");
  // Attempt to require the server locally just to see if it parses.
  const checkJs = execSync('node -e "require(\'./server/server.js\')" --unhandled-rejections=strict', { timeout: 8000 });
  console.log(checkJs.toString());
} catch(e) {
  console.log("ERROR OUTPUT:\n", e.stdout ? e.stdout.toString() : e.message);
}
