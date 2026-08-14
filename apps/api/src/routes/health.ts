import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';
import { cacheService } from '../services/cache.service';

export async function healthRoutes(server: FastifyInstance) {
  const checkReadiness = async () => {
    const health = {
      status: 'healthy',
      api: 'online',
      redis: 'offline',
      database: 'offline',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    };

    // Test DB with short timeout logic if needed, but supabase from() should handle its own
    try {
      const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
      if (!error) health.database = 'online';
    } catch (e) {
      // db offline
    }

    // Test Redis
    try {
      await cacheService.get('health_ping');
      health.redis = 'online';
    } catch (e) {
      // redis offline
    }

    if (health.database === 'offline' || health.redis === 'offline') {
      health.status = 'degraded';
      return { statusCode: 503, health };
    }

    return { statusCode: 200, health };
  };

  // Apenas verifica se o processo Fastify está de pé (não bate em banco)
  server.get('/health/live', async (request, reply) => {
    return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Valida conexões vitais
  server.get('/health/ready', async (request, reply) => {
    const result = await checkReadiness();
    return reply.status(result.statusCode).send(result.health);
  });

  // Alias para readiness
  server.get('/health', async (request, reply) => {
    const result = await checkReadiness();
    return reply.status(result.statusCode).send(result.health);
  });

  // Métricas (stub)
  server.get('/metrics', async (request, reply) => {
    return reply.status(200).send({
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    });
  });
}
