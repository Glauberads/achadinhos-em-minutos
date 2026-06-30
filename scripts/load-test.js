const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Alvo: Nossa API local simulando estresse extremo no endpoint de geração (que dispara workers)
const TARGET_URL = 'http://localhost:3001/api/creatives/generate';
const BEARER_TOKEN = 'SIMULATED_TEST_TOKEN_FOR_LOAD'; // Requer desativar auth local ou usar token real fixo.

const instance = autocannon({
  url: TARGET_URL,
  connections: 50, // 50 conexões simultâneas
  pipelining: 1,
  duration: 20, // 20 segundos de bombardeio contínuo
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`
  },
  body: JSON.stringify({
    url: 'https://shopee.com.br/test-product-load-123'
  })
}, (err, result) => {
  if (err) {
    console.error('Erro ao rodar Autocannon:', err);
    return;
  }
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '../docs/reports/load-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  
  console.log('\n=============================================');
  console.log('🚀 TESTE DE CARGA CONCLUÍDO (Autocannon)');
  console.log('=============================================');
  console.log(`- Requisições Totais: ${result.requests.total}`);
  console.log(`- Latência Média: ${result.latency.average} ms`);
  console.log(`- Falhas (Timeouts/Erros): ${result.errors}`);
  console.log(`- Status 2xx: ${result.statusCodeStats['200'] || result.statusCodeStats['201'] || 0}`);
  console.log(`- Status 5xx: ${result.statusCodeStats['500'] || 0}`);
  console.log('\nRelatório salvo em: docs/reports/load-test-report.json');
});

// Acompanhar o progresso em tempo real no console
autocannon.track(instance, { renderProgressBar: true });
