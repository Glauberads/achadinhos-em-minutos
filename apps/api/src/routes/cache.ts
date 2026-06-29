import { FastifyInstance } from 'fastify';
import { cacheService } from '../services/cache.service';
import { requireAuth } from '../middleware/auth.middleware';

export async function cacheRoutes(server: FastifyInstance) {

  // Healthcheck do Redis Cache
  server.get('/health', { preHandler: [requireAuth] }, async (request, reply) => {
    // Idealmente, apenas admins teriam acesso a isso (Fase 14 - Multi-Tenant / RBAC)
    // Como estamos na Fase 9, o JWT Auth padrão protegerá de acessos anônimos
    const health = await cacheService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : (health.status === 'degraded' ? 200 : 503);

    return reply.status(statusCode).send({
      success: health.status !== 'unhealthy',
      data: health
    });
  });

}
