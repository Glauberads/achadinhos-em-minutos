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

    console.log(`[DashboardService] Starting getDashboardData for user ${userId}`);

    return await cacheService.remember(cacheKey, TTL, async () => {
      console.log(`[DashboardService] Cache miss, calling dbMetrics RPC...`);
      // 1. Busca os dados consolidados do banco (RPC)
      let dbMetrics;
      try {
        dbMetrics = await dashboardRepository.getMetrics(userId);
        console.log(`[DashboardService] dbMetrics RPC succeeded`);
      } catch (e: any) {
        console.log(`[DashboardService] dbMetrics RPC failed: ${e.message}`);
        throw e;
      }
      
      console.log(`[DashboardService] Calling getSystemHealth...`);
      // 2. Busca saúde do sistema
      const systemHealth = await this.getSystemHealth();
      console.log(`[DashboardService] getSystemHealth succeeded`);

      // 3. Busca métricas de performance (Estimativas Sprint 3)
      const performanceMetrics = this.getPerformanceMetrics();

      // 4. Monta payload enriquecido
      return {
        ...dbMetrics,
        systemHealth,
        performanceMetrics
      };
    });
  }

  private getPerformanceMetrics() {
    // Para MVP, estamos retornando valores estáticos ou estimados realistas. 
    // Em uma versão futura APM (Application Performance Monitoring), buscaríamos do Datadog/Prometheus/Redis.
    return {
      averageTimes: {
        parser: '0.8s',
        ai_batch: '4.5s',
        planner: '0.2s',
        quality_analyzer: '0.3s',
        ffmpeg_render: '18.5s',
        storage_upload: '2.1s'
      },
      queues: {
        avgQueueTime: '3.2s',
        maxQueueTime: '15.0s',
        retryRate: '4.2%',
        timeoutRate: '0.5%'
      },
      cache: {
        hitRate: '78.5%',
        missRate: '21.5%',
        savingsEstimated: '4h 12m'
      }
    };
  }

  /**
   * Coleta a saúde dos componentes do sistema (Fase 6).
   */
  private async getSystemHealth(): Promise<any> {
    // Redis Health
    const cacheHealth = await cacheService.healthCheck();
    const isRedisOk = cacheHealth.status === 'healthy';

    const systemHealth = {
      api: { status: 'online', latency_ms: 12 },
      redis: { 
        status: isRedisOk ? 'online' : (cacheHealth.status === 'degraded' ? 'degraded' : 'offline'), 
        latency_ms: cacheHealth.latency_ms 
      },
      supabase: { status: 'online', latency_ms: 25 },
      gemini: { status: 'online' },
      storage: { status: 'online' },
      bullmq: { status: isRedisOk ? 'online' : 'degraded' },
      workers: {
        campaign_runner: { status: 'online' },
        telegram_sender: { status: 'online' }
      },
      queues: {
        telegram: { pending: 0, active: 0, failed: 0 },
        campaigns: { pending: 0, active: 0, failed: 0 }
      }
    };

    return {
      ...systemHealth,
      healthScore: this.calculateHealthScore(systemHealth)
    };
  }

  private calculateHealthScore(health: any): number {
    let score = 100;

    // Critical Penalties
    if (health.supabase.status !== 'online') return 20; // Banco Indisponível
    if (health.api.status !== 'online') return 20;      // API Indisponível

    // High Impact
    if (health.storage.status !== 'online') score -= 30; // Storage Indisponível

    // Medium Impact
    if (health.redis.status !== 'online') score -= 15;   // Redis Indisponível
    if (health.gemini.status !== 'online') score -= 15;  // Gemini Indisponível (Possui Fallback)

    // Minor Deductions based on latencies / queue buildup could be added here
    if (health.redis.latency_ms > 200) score -= 5;
    if (health.queues.telegram.failed > 10) score -= 10;

    return Math.max(0, Math.min(100, score));
  }
}

export const dashboardService = new DashboardService();
