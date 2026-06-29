import { redisConnection } from '../lib/redis';
import { eventBus, CacheHitEvent, CacheMissEvent, CacheSetEvent, CacheDeleteEvent, CacheInvalidatedEvent, CacheErrorEvent, CacheHealthCheckEvent } from '../events';
import { CacheHealthResponse, CacheValue } from '../cache/cache.types';

const DEFAULT_TTL = 3600; // 1 hora

/**
 * CacheService — Camada de cache Enterprise (Fase 9).
 * Desacoplado, seguro e integrado com o EventBus.
 */
export class CacheService {
  
  /**
   * Tenta recuperar um valor. Em caso de falha de conexão, retorna null (Fallback seguro).
   */
  async get<T = CacheValue>(key: string): Promise<T | null> {
    try {
      const data = await redisConnection.get(key);
      
      if (data) {
        eventBus.emit(new CacheHitEvent({ key }, { source: 'cache-service' }));
        return JSON.parse(data) as T;
      }
      
      eventBus.emit(new CacheMissEvent({ key }, { source: 'cache-service' }));
      return null;
    } catch (error: any) {
      this.emitError('get', key, error.message);
      return null; // Fallback
    }
  }

  /**
   * Salva um valor no cache.
   */
  async set<T = CacheValue>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
      this.assertCacheSafe(value);
      
      const serialized = JSON.stringify(value);
      await redisConnection.set(key, serialized, 'EX', ttlSeconds);
      
      eventBus.emit(new CacheSetEvent({ key, ttl_seconds: ttlSeconds }, { source: 'cache-service' }));
    } catch (error: any) {
      this.emitError('set', key, error.message);
      // Fallback: Apenas engole o erro para não quebrar o fluxo da aplicação.
    }
  }

  /**
   * Padrão Cache-Aside Seguro. Tenta pegar do Redis, senão executa a função e salva no Redis.
   */
  async remember<T = CacheValue>(key: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Miss - buscar da fonte original
    const freshData = await callback();
    
    // Salva em background (Fire and forget) para não atrasar a resposta
    this.set(key, freshData, ttlSeconds).catch(() => {});
    
    return freshData;
  }

  /**
   * Remove uma chave específica.
   */
  async delete(key: string): Promise<void> {
    try {
      await redisConnection.del(key);
      eventBus.emit(new CacheDeleteEvent({ key }, { source: 'cache-service' }));
    } catch (error: any) {
      this.emitError('delete', key, error.message);
    }
  }

  /**
   * Remove múltiplas chaves baseado em um padrão usando SCAN (anti-travamento).
   * NUNCA usa o comando `KEYS *`.
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const result = await redisConnection.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          await redisConnection.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      eventBus.emit(new CacheInvalidatedEvent({ pattern, keys_deleted: deletedCount }, { source: 'cache-service' }));
    } catch (error: any) {
      this.emitError('deletePattern', pattern, error.message);
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async has(key: string): Promise<boolean> {
    try {
      return (await redisConnection.exists(key)) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Incrementa um contador atômico e ajusta o TTL se for novo.
   */
  async increment(key: string, ttlSeconds: number = DEFAULT_TTL): Promise<number> {
    try {
      const val = await redisConnection.incr(key);
      if (val === 1) {
        await redisConnection.expire(key, ttlSeconds);
      }
      return val;
    } catch (error: any) {
      this.emitError('increment', key, error.message);
      return 1; // Fallback otimista
    }
  }

  /**
   * Endpoint interno de healthcheck do Redis
   */
  async healthCheck(): Promise<CacheHealthResponse> {
    const start = Date.now();
    try {
      await redisConnection.ping();
      const latency = Date.now() - start;
      const info = await redisConnection.info();
      
      // Parse básico de info do redis
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';
      
      const keysMatch = info.match(/keys=([0-9]+)/);
      const keysEstimated = keysMatch ? parseInt(keysMatch[1], 10) : 0;

      const response: CacheHealthResponse = {
        connected: true,
        latency_ms: latency,
        memory_used: memoryUsed,
        keys_estimated: keysEstimated,
        status: latency > 1000 ? 'degraded' : 'healthy',
        last_error: null
      };

      eventBus.emit(new CacheHealthCheckEvent({ status: response.status, latency_ms: latency }, { source: 'cache-service' }));
      return response;

    } catch (error: any) {
      const response: CacheHealthResponse = {
        connected: false,
        latency_ms: Date.now() - start,
        memory_used: 'unknown',
        keys_estimated: 0,
        status: 'unhealthy',
        last_error: error.message
      };
      
      eventBus.emit(new CacheHealthCheckEvent({ status: 'unhealthy', latency_ms: response.latency_ms }, { source: 'cache-service' }));
      return response;
    }
  }

  // ============================
  // SEGURANÇA E UTILITÁRIOS
  // ============================

  /**
   * Previne salvamento acidental de tokens e credenciais no Redis.
   */
  private assertCacheSafe(value: any): void {
    if (!value) return;

    const sensitiveKeys = [
      'token', 'secret', 'password', 'authorization', 'api_key', 
      'service_role', 'refresh_token', 'access_token', 'client_secret'
    ];

    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    const lowerStr = strValue.toLowerCase();

    for (const key of sensitiveKeys) {
      // Se encontrar menção a alguma destas chaves no payload JSON (ex: "access_token": "xxx")
      if (lowerStr.includes(`"${key}"`) || lowerStr.includes(`'${key}'`)) {
        throw new Error(`Security Violation: Attempted to cache sensitive data containing '${key}'.`);
      }
    }
  }

  private emitError(operation: string, key: string, errorMessage: string) {
    eventBus.emit(new CacheErrorEvent({ operation, key, error_message: errorMessage }, { source: 'cache-service' }));
  }
}

export const cacheService = new CacheService();
