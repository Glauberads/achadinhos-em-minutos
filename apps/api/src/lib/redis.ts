import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { applicationRedisOptions, bullMQRedisOptions } from './redis-options';
dotenv.config();

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

// Conexão principal da aplicação (cache, sessões, etc.)
export const redisConnection = new IORedis(redisUrl, {
  ...applicationRedisOptions,
});

// Conexão dedicada para BullMQ (exige maxRetriesPerRequest: null)
export const bullMQConnection = new IORedis(redisUrl, {
  ...bullMQRedisOptions,
});

const LOG_THROTTLE_MS = 30_000;

const attachLifecycleLogging = (client: IORedis, role: string) => {
  let lastErrorLogAt = 0;
  let lastReconnectLogAt = 0;
  let lastCloseLogAt = 0;

  client.on('connect', () => console.info(`[Redis:${role}] Connection established`));
  client.on('ready', () => console.info(`[Redis:${role}] Ready`));
  client.on('reconnecting', (delay: number) => {
    const now = Date.now();
    if (now - lastReconnectLogAt >= LOG_THROTTLE_MS) {
      console.warn(`[Redis:${role}] Reconnecting in ${delay}ms`);
      lastReconnectLogAt = now;
    }
  });
  client.on('close', () => {
    const now = Date.now();
    if (now - lastCloseLogAt >= LOG_THROTTLE_MS) {
      console.warn(`[Redis:${role}] Connection closed`);
      lastCloseLogAt = now;
    }
  });
  client.on('end', () => console.error(`[Redis:${role}] Reconnection stopped`));
  client.on('error', (error: Error) => {
    const now = Date.now();
    if (now - lastErrorLogAt >= LOG_THROTTLE_MS) {
      console.warn(`[Redis:${role}] Unavailable: ${error.message}`);
      lastErrorLogAt = now;
    }
  });
};

attachLifecycleLogging(redisConnection, 'application');
attachLifecycleLogging(bullMQConnection, 'bullmq');
