import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { featureFlagService } from '../services/feature-flag.service';

export async function featureFlagsRoutes(server: FastifyInstance) {

  // GET /api/feature-flags
  // Root endpoint — returns all flags as a flat {key: boolean} map
  server.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const flags = await featureFlagService.getAllFlagsCached();
    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      result[flag.key] = await featureFlagService.isEnabled(flag.key, { userId: request.user.id });
    }
    return reply.status(200).send({ flags: result });
  });

  // GET /api/feature-flags/active
  // Frontend consulta quais features estão ativas para o usuário atual
  server.get('/active', { preHandler: [requireAuth] }, async (request, reply) => {
    
    // Obter todas as flags cacheadas
    const flags = await featureFlagService.getAllFlagsCached();
    
    const activeFlags: Record<string, boolean> = {};

    // Resolver cada flag no contexto do usuário
    for (const flag of flags) {
      activeFlags[flag.key] = await featureFlagService.isEnabled(flag.key, {
        userId: request.user.id
      });
    }

    return reply.status(200).send({
      success: true,
      data: activeFlags
    });
  });

  // POST /api/feature-flags/:key/toggle (Admin Only)
  const toggleSchema = z.object({
    enabled: z.boolean()
  });

  server.post('/:key/toggle', { preHandler: [requireAuth] }, async (request, reply) => {
    const { key } = request.params as { key: string };
    const { enabled } = toggleSchema.parse(request.body);

    // TODO: Adicionar validação de Role admin (Fase 14)
    // Para a Fase 10, qualquer usuário autenticado conseguiria alternar as flags
    // Na vida real, teríamos um requireAdmin middleware aqui.

    const success = await featureFlagService.toggleFlag(key, enabled, request.user.id);

    if (!success) {
      return reply.status(500).send({ error: 'Failed to toggle feature flag' });
    }

    return reply.status(200).send({ success: true });
  });

}
