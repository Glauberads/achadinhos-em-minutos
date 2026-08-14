import { describe, expect, it } from 'vitest';
import {
  applicationRedisOptions,
  bullMQRedisOptions,
  redisRetryStrategy,
} from '../../src/lib/redis-options';

describe('Redis reconnection options', () => {
  it('uses bounded exponential backoff without permanently stopping retries', () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(redisRetryStrategy)).toEqual([
      250,
      500,
      1_000,
      2_000,
      4_000,
      5_000,
      5_000,
    ]);
  });

  it('keeps application commands fail-fast while reconnection continues', () => {
    expect(applicationRedisOptions).toMatchObject({
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      enableReadyCheck: true,
      retryStrategy: redisRetryStrategy,
    });
  });

  it('uses BullMQ-compatible retry semantics', () => {
    expect(bullMQRedisOptions).toMatchObject({
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: redisRetryStrategy,
    });
  });
});
