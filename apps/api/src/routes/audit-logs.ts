import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { auditRepository } from '../repositories/audit.repository';

export async function auditLogsRoutes(server: FastifyInstance) {

  // Schema de validação Zod para os filtros GET
  const getAuditLogsQuerySchema = z.object({
    organization_id: z.string().uuid().optional(),
    event_name: z.string().optional(),
    action: z.string().optional(),
    entity: z.string().optional(),
    entity_id: z.string().optional(),
    severity: z.string().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    correlation_id: z.string().optional(),
    request_id: z.string().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
  });

  server.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const resultParse = getAuditLogsQuerySchema.safeParse(request.query);
      
      if (!resultParse.success) {
        return reply.status(400).send({
          error: 'Parâmetros de filtro inválidos',
          details: resultParse.error.errors
        });
      }

      const query = resultParse.data;
      const user_id = request.user.id;

      const result = await auditRepository.findLogs({
        ...query,
        user_id // FORCE security: user pode ver apenas seus logs
      });

      return reply.status(200).send({
        success: true,
        data: result.items || [],
        pagination: {
          total: result.total || 0,
          page: result.page || 1,
          limit: result.limit || 50,
          hasMore: result.hasMore || false,
        },
        filters_applied: Object.keys(query).filter(k => (query as any)[k] !== undefined)
      });
    } catch (err: any) {
      console.error('[audit-logs/GET] Error:', err);
      // Fail-safe array vazio em caso de falha de DB para não quebrar UI
      return reply.status(200).send({
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit: 50, hasMore: false },
        filters_applied: []
      });
    }
  });

  server.get('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await auditRepository.findByEventId(id);

      if (!result) {
        return reply.status(404).send({ error: 'Audit log not found' });
      }

      if (result.user_id !== request.user.id) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      console.error('[audit-logs/GET_ID] Error:', err);
      return reply.status(500).send({ error: 'Erro interno ao buscar log' });
    }
  });
  
  server.get('/correlation/:correlationId', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const { correlationId } = request.params as { correlationId: string };
      const result = await auditRepository.findByCorrelationId(correlationId);

      // Filtrar apenas os que o usuário tem acesso (Segurança)
      const filtered = result ? result.filter(item => item.user_id === request.user.id) : [];

      return reply.status(200).send({ success: true, data: filtered });
    } catch (err: any) {
      console.error('[audit-logs/GET_CORRELATION] Error:', err);
      return reply.status(500).send({ error: 'Erro interno ao buscar logs por correlação' });
    }
  });
}
