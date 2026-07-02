const http = require('http');

async function checkStatus(url, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request(url, { method }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', (e) => resolve(`Error: ${e.message}`));
    req.end();
  });
}

async function run() {
  const h1 = await checkStatus('http://localhost:3001/health');
  console.log('GET /health =>', h1);

  const h2 = await checkStatus('http://localhost:3001/api/health');
  console.log('GET /api/health =>', h2);

  const h3 = await checkStatus('http://localhost:3001/api/creatives');
  console.log('GET /api/creatives =>', h3); // Deve dar 401 porque requireAuth está ativo e não enviamos token

  const h4 = await checkStatus('http://localhost:3001/api/audit-logs?page=1&limit=100');
  console.log('GET /api/audit-logs =>', h4); // 401 tbm

  const h5 = await checkStatus('http://localhost:3001/api/creatives/generate-image-from-link', 'POST');
  console.log('POST /api/creatives/generate-image-from-link =>', h5); // 401 tbm
}

run();
