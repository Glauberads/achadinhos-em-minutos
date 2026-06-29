import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.middleware';
import { dashboardService } from '../services/dashboard.service';

export async function dashboardRoutes(server: FastifyInstance) {

  // GET /api/dashboard/metrics
  // Retorna todas as métricas do Dashboard Executivo. Usa cache de 60s internamente.
  server.get('/metrics', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const data = await dashboardService.getDashboardData(request.user.id);
      
      return reply.status(200).send({
        success: true,
        data
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro interno ao carregar dashboard'
      });
    }
  });

}
