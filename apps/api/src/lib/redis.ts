import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

// Conexão principal da aplicação (cache, sessões, etc.)
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: 1,       // Não tentar infinitamente
  connectTimeout: 2000,           // Desistir de conectar em 2s
  lazyConnect: false,
  enableOfflineQueue: false,      // Não enfileirar quando desconectado
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
});

// Conexão dedicada para BullMQ (exige maxRetriesPerRequest: null)
export const bullMQConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,    // Obrigatório para BullMQ
  connectTimeout: 2000,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
});

const silenceError = (err: Error & { _logged?: boolean }) => {
  if (!err._logged) {
    console.warn('[Redis] Unavailable (running without cache):', err.message);
    err._logged = true;
  }
};

redisConnection.on('error', silenceError);
bullMQConnection.on('error', silenceError);

redisConnection.on('connect', () => console.log('[Redis] Main connection established'));
bullMQConnection.on('connect', () => console.log('[Redis] BullMQ connection established'));

