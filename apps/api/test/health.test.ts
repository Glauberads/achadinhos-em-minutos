import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/server';

describe('API Health Endpoint', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  // Build the real Fastify application
  // Note: This may emit Redis/Supabase warnings if ENV vars are not set,
  // but the health endpoints should still respond.

  it('GET /health returns 503 when degraded', async () => {
    app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(503); // 503 because Redis/DB are offline in test env

    const body = JSON.parse(response.payload);
    expect(body.status).toBe('degraded');
  });

  it('GET /health/ready returns 503 when degraded', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(503);

    const body = JSON.parse(response.payload);
    expect(body.status).toBe('degraded');
  });

  it('GET /health/live returns 200 with ok status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/live',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
