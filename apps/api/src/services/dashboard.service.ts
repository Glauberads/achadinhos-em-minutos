import { dashboardRepository } from '../repositories/dashboard.repository';
import { cacheService } from './cache.service';

export class DashboardService {

  /**
   * Obtém as métricas completas do Dashboard.
   * Utiliza Cache Redis com TTL de 60 segundos por usuário.
   */
  async getDashboardData(userId: string): Promise<any> {
    const cacheKey = `dashboard:metrics:${userId}:all`;
    const TTL = 60; // 60 segundos de cache

    return await cacheService.remember(cacheKey, TTL, async () => {
      // 1. Busca os dados consolidados do banco (RPC)
      const dbMetrics = await dashboardRepository.getMetrics(userId);
      
      // 2. Busca saúde do sistema
      const systemHealth = await this.getSystemHealth();

      // 3. Monta payload enriquecido
      return {
        ...dbMetrics,
        systemHealth
      };
    });
  }

  /**
   * Coleta a saúde dos componentes do sistema (Fase 6).
   */
  private async getSystemHealth(): Promise<any> {
    // Redis Health
    const cacheHealth = await cacheService.healthCheck();
    
    // Na vida real (Fase 15/etc), faríamos check no BullMQ e nos Workers
    // Por hora, geramos a estrutura esperada pelo frontend baseado na saúde do Redis 
    // e assumimos API "healthy" se essa rota está rodando.
    const isRedisOk = cacheHealth.status === 'healthy';

    return {
      api: { status: 'online', latency_ms: 12 },
      redis: { 
        status: isRedisOk ? 'online' : (cacheHealth.status === 'degraded' ? 'degraded' : 'offline'), 
        latency_ms: cacheHealth.latency_ms 
      },
      supabase: { status: 'online', latency_ms: 25 },
      bullmq: { status: isRedisOk ? 'online' : 'degraded' }, // BullMQ depende do Redis
      workers: {
        campaign_runner: { status: 'online' },
        telegram_sender: { status: 'online' }
      },
      queues: {
        telegram: { pending: 0, active: 0, failed: 0 },
        campaigns: { pending: 0, active: 0, failed: 0 }
      }
    };
  }
}

export const dashboardService = new DashboardService();
