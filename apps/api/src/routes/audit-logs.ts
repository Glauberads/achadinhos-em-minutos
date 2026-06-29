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
    // 1. Validação estrita via Zod
    const query = getAuditLogsQuerySchema.parse(request.query);

    // 2. Isolamento Multi-tenant (RLS) via Repository
    // A query no DB já aplicará RLS. Mas para garantir, podemos forçar user_id 
    // ou organization_id se não for admin. Como o RLS está protegendo, 
    // a nível de aplicação o Repository já isola dados por design (usando supabase client com auth) 
    // mas aqui estamos usando o supabaseAdmin (Service Role) no backend, 
    // ENTÃO a aplicação é quem deve forçar o user_id para não vazar logs de outros!
    
    const user_id = request.user.id;

    // 3. Execução (Repository)
    const result = await auditRepository.findLogs({
      ...query,
      user_id // FORCE security: user pode ver apenas seus logs
    });

    // 4. Retorno
    return reply.status(200).send({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      },
      filters_applied: Object.keys(query).filter(k => (query as any)[k] !== undefined)
    });
  });

  server.get('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // NOTA: Como usamos supabaseAdmin no repositório, precisamos implementar a restrição de ID aqui
    // Futuro ideal: criar um SupabaseClient com RLS do usuário logado (createServerClient).
    // Por enquanto, faremos fetch no repository e checaremos se o user_id bate.
    const result = await auditRepository.findByEventId(id);

    if (!result) {
      return reply.status(404).send({ error: 'Audit log not found' });
    }

    if (result.user_id !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return reply.status(200).send({ success: true, data: result });
  });
  
  server.get('/correlation/:correlationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { correlationId } = request.params as { correlationId: string };
    const result = await auditRepository.findByCorrelationId(correlationId);

    // Filtrar apenas os que o usuário tem acesso (Segurança)
    const filtered = result.filter(item => item.user_id === request.user.id);

    return reply.status(200).send({ success: true, data: filtered });
  });
}
