import type { RedisOptions } from 'ioredis';

const MAX_RECONNECT_DELAY_MS = 5_000;

/**
 * Keep retrying for transient outages with bounded exponential backoff.
 * Returning null/undefined would permanently stop ioredis reconnection.
 */
export const redisRetryStrategy = (times: number): number => {
  const exponent = Math.min(Math.max(times - 1, 0), 5);
  return Math.min(250 * (2 ** exponent), MAX_RECONNECT_DELAY_MS);
};

export const applicationRedisOptions: RedisOptions = {
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
  lazyConnect: false,
  enableOfflineQueue: false,
  enableReadyCheck: true,
  retryStrategy: redisRetryStrategy,
};

export const bullMQRedisOptions: RedisOptions = {
  // BullMQ requires commands to wait through transient connection failures.
  maxRetriesPerRequest: null,
  connectTimeout: 2_000,
  enableReadyCheck: true,
  retryStrategy: redisRetryStrategy,
};
