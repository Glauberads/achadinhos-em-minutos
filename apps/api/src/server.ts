import Fastify from 'fastify';
import { telegramRoutes } from './routes/telegram';
import { productRoutes } from './routes/products';
import { marketplaceRoutes } from './routes/marketplaces';
import { campaignRoutes } from './routes/campaigns';
import { auditLogsRoutes } from './routes/audit-logs';
import { cacheRoutes } from './routes/cache';
import { featureFlagsRoutes } from './routes/feature-flags';
import { dashboardRoutes } from './routes/dashboard';
import { registerEvents } from './events/event-registry';

const server = Fastify({
  logger: true
});

// Registrar eventos globalmente antes de qualquer requisição
registerEvents();

// ============================
// CORS Configurável
// ============================
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

server.addHook('onRequest', (request, reply, done) => {
  const origin = request.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    reply.header('Access-Control-Allow-Origin', origin);
  }

  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  reply.header('Access-Control-Allow-Credentials', 'true');

  if (request.method === 'OPTIONS') {
    reply.status(200).send();
    return;
  }
  done();
});

// ============================
// Error Handler Global (Zod + erros genéricos)
// ============================
server.setErrorHandler((error, request, reply) => {
  // Erros de validação Zod (via validateBody)
  if ((error as any).validation && (error as any).statusCode === 400) {
    return reply.status(400).send({
      error: 'Erro de validação',
      details: (error as any).validation,
    });
  }

  // Erros HTTP conhecidos
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: error.message,
    });
  }

  // Erros internos — log sem expor stack ao cliente
  request.log.error(error);
  return reply.status(500).send({
    error: 'Erro interno do servidor',
  });
});

// ============================
// Health Check
// ============================
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// ============================
// Registrar Rotas
// ============================
server.register(telegramRoutes, { prefix: '/api/telegram' });
server.register(productRoutes, { prefix: '/api/products' });
server.register(marketplaceRoutes, { prefix: '/api/marketplaces' });
server.register(campaignRoutes, { prefix: '/api/campaigns' });
server.register(auditLogsRoutes, { prefix: '/api/audit-logs' });
server.register(cacheRoutes, { prefix: '/api/cache' });
server.register(featureFlagsRoutes, { prefix: '/api/feature-flags' });
server.register(dashboardRoutes, { prefix: '/api/dashboard' });

// ============================
// Iniciar Servidor
// ============================
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
