import Fastify, { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { healthRoutes, HealthDependencies } from '../src/routes/health';

const onlineDependencies = (): HealthDependencies => ({
  checkDatabase: vi.fn().mockResolvedValue(undefined),
  pingRedis: vi.fn().mockResolvedValue('PONG'),
});

describe('canonical health routes', () => {
  let app: FastifyInstance | undefined;

  const buildHealthApp = async (dependencies: HealthDependencies, prefix?: string) => {
    app = Fastify({ logger: false });
    await app.register(healthRoutes, { prefix, dependencies });
    await app.ready();
    return app;
  };

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('keeps liveness healthy when Redis and database are offline', async () => {
    const dependencies: HealthDependencies = {
      checkDatabase: vi.fn().mockRejectedValue(new Error('database offline')),
      pingRedis: vi.fn().mockRejectedValue(new Error('redis offline')),
    };
    const server = await buildHealthApp(dependencies);

    const response = await server.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
    expect(dependencies.checkDatabase).not.toHaveBeenCalled();
    expect(dependencies.pingRedis).not.toHaveBeenCalled();
  });

  it('returns ready when Redis responds PONG and the database query succeeds', async () => {
    const server = await buildHealthApp(onlineDependencies());

    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'healthy',
      redis: 'online',
      database: 'online',
    });
  });

  it('returns 503 when Redis is offline', async () => {
    const dependencies = onlineDependencies();
    dependencies.pingRedis = vi.fn().mockRejectedValue(new Error('redis offline'));
    const server = await buildHealthApp(dependencies);

    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'degraded', redis: 'offline' });
  });

  it('becomes ready again when Redis recovers without rebuilding the app', async () => {
    const dependencies = onlineDependencies();
    dependencies.pingRedis = vi.fn()
      .mockRejectedValueOnce(new Error('redis offline'))
      .mockResolvedValue('PONG');
    const server = await buildHealthApp(dependencies);

    const unavailable = await server.inject({ method: 'GET', url: '/health/ready' });
    const restored = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json()).toMatchObject({ redis: 'offline' });
    expect(restored.statusCode).toBe(200);
    expect(restored.json()).toMatchObject({ status: 'healthy', redis: 'online' });
    expect(dependencies.pingRedis).toHaveBeenCalledTimes(2);
  });

  it('returns 503 when the database is offline', async () => {
    const dependencies = onlineDependencies();
    dependencies.checkDatabase = vi.fn().mockRejectedValue(new Error('database offline'));
    const server = await buildHealthApp(dependencies);

    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'degraded', database: 'offline' });
  });

  it('does not treat a null cache-style response as Redis health', async () => {
    const dependencies = onlineDependencies();
    dependencies.pingRedis = vi.fn().mockResolvedValue(null);
    const server = await buildHealthApp(dependencies);

    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'degraded', redis: 'offline' });
  });

  it('preserves the readiness alias at /health', async () => {
    const server = await buildHealthApp(onlineDependencies());

    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
  });

  it('supports the /api prefix used by the Nginx reverse proxy', async () => {
    const server = await buildHealthApp(onlineDependencies(), '/api');

    const response = await server.inject({ method: 'GET', url: '/api/health/live' });

    expect(response.statusCode).toBe(200);
  });
});
