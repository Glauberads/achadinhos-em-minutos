import { FastifyInstance } from 'fastify';

export interface HealthDependencies {
  checkDatabase: () => Promise<void>;
  pingRedis: () => Promise<string | null>;
}

export interface HealthRouteOptions {
  dependencies?: HealthDependencies;
}

const defaultDependencies: HealthDependencies = {
  async checkDatabase() {
    const { supabaseAdmin } = await import('../lib/supabase');
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);

    if (error) {
      throw error;
    }
  },

  async pingRedis() {
    const { redisConnection } = await import('../lib/redis');
    return redisConnection.ping();
  },
};

export async function healthRoutes(server: FastifyInstance, options: HealthRouteOptions = {}) {
  const dependencies = options.dependencies ?? defaultDependencies;

  const checkReadiness = async () => {
    const health = {
      status: 'healthy',
      api: 'online',
      redis: 'offline',
      database: 'offline',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    };

    try {
      await dependencies.checkDatabase();
      health.database = 'online';
    } catch {
      // Database remains offline in the readiness response.
    }

    try {
      const response = await dependencies.pingRedis();
      if (response === 'PONG') {
        health.redis = 'online';
      }
    } catch {
      // Redis remains offline in the readiness response.
    }

    if (health.database === 'offline' || health.redis === 'offline') {
      health.status = 'degraded';
      return { statusCode: 503, health };
    }

    return { statusCode: 200, health };
  };

  server.get('/health/live', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  server.get('/health/ready', async (_request, reply) => {
    const result = await checkReadiness();
    return reply.status(result.statusCode).send(result.health);
  });

  server.get('/health', async (_request, reply) => {
    const result = await checkReadiness();
    return reply.status(result.statusCode).send(result.health);
  });

  server.get('/metrics', async (_request, reply) => {
    return reply.status(200).send({
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    });
  });
}
