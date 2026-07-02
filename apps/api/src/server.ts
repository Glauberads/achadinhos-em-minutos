import Fastify from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { telegramRoutes } from './routes/telegram';
import { productRoutes } from './routes/products';
import { marketplaceRoutes } from './routes/marketplaces';
import { campaignRoutes } from './routes/campaigns';
import { auditLogsRoutes } from './routes/audit-logs';
import { cacheRoutes } from './routes/cache';
import { featureFlagsRoutes } from './routes/feature-flags';
import { dashboardRoutes } from './routes/dashboard';
import { creativeRoutes } from './routes/creatives';
import { registerEvents } from './events/event-registry';

// Inicializar workers
import './workers/creative-render.worker';

import multipart from '@fastify/multipart';

const server = Fastify({
  logger: true
});

server.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
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
// Telemetry Hook
// ============================
import { telemetryService } from './services/telemetry.service';

server.addHook('onRequest', (request, reply, done) => {
  (request as any).startTime = performance.now();
  done();
});

server.addHook('onResponse', (request, reply, done) => {
  const startTime = (request as any).startTime;
  if (startTime && !request.url.includes('/health')) {
    const totalTime = Math.round(performance.now() - startTime);
    const userId = (request as any).user?.id;
    
    // Non-blocking telemetry
    telemetryService.log({
      user_id: userId,
      operation_type: 'API_REQUEST',
      endpoint: request.url,
      total_time_ms: totalTime,
      status: reply.statusCode >= 400 ? 'ERROR' : 'SUCCESS',
      metadata: { method: request.method, statusCode: reply.statusCode }
    });
  }
  done();
});

// ============================
// Error Handler Global (Zod + erros genéricos)
// ============================
server.setErrorHandler((error, request, reply) => {
  const correlation_id = (request.headers['x-correlation-id'] as string) || crypto.randomUUID();
  const userId = (request as any).user?.id || 'anonymous';
  const timestamp = new Date().toISOString();

  // Ocultar stack trace do cliente, mas registrar tudo no backend
  const logPayload = {
    correlation_id,
    route: request.url,
    method: request.method,
    user_id: userId,
    error_message: error.message,
    stack: error.stack,
    timestamp
  };
  
  console.error('[Global Error Handler]', JSON.stringify(logPayload, null, 2));

  // Erros de validação Zod (via validateBody ou direct parse)
  if (error instanceof z.ZodError || ((error as any).validation && (error as any).statusCode === 400)) {
    return reply.status(400).send({
      error: 'Erro de validação',
      details: error instanceof z.ZodError ? error.errors : (error as any).validation,
      correlation_id
    });
  }

  // Erros do Supabase (ex: foreign key, uuid inválido)
  if ((error as any).code && typeof (error as any).code === 'string' && (error as any).code.length === 5) {
    return reply.status(400).send({
      error: 'Erro de banco de dados ou integridade referencial.',
      correlation_id
    });
  }

  // Erros HTTP conhecidos (Fastify)
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: error.message,
      correlation_id
    });
  }

  // Erro Genérico / 500
  return reply.status(500).send({
    error: 'Erro interno do servidor',
    correlation_id
  });
});

// ============================
// Health Check
// ============================
const healthCheckHandler = async (request: any, reply: any) => {
  const health = {
    status: 'ok',
    api: 'online',
    redis: 'offline',
    database: 'offline',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  };

  try {
    const { supabaseAdmin } = await import('./lib/supabase');
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);
    if (!error) {
      health.database = 'online';
    }
  } catch (e) {
    // db offline
  }

  try {
    const { cacheService } = await import('./services/cache.service');
    // Assuming a ping method or just relying on generic catch if redis is truly down
    // Since we don't have direct ping in cacheService necessarily, we try a dummy get
    await cacheService.get('health_ping');
    health.redis = 'online';
  } catch (e) {
    // redis offline
  }

  if (health.database === 'offline' || health.redis === 'offline') {
    health.status = 'degraded';
  }

  return reply.status(200).send(health);
};

server.get('/health', healthCheckHandler);
server.get('/api/health', healthCheckHandler);

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
server.register(creativeRoutes, { prefix: '/api/creatives' });

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
