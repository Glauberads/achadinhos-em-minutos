import { logger } from '../lib/logger';
import dotenv from 'dotenv';
dotenv.config();

import './telegram-sender';

const shutdown = async (signal: string) => {
  logger.info({ event: 'worker_shutdown_initiated', worker: 'telegram-worker', signal });
  try {
    const { cacheService } = await import('../services/cache.service');
    if (cacheService) await cacheService.quit();
    
    logger.info({ event: 'worker_shutdown_complete', worker: 'telegram-worker' });
    process.exit(0);
  } catch (err) {
    logger.error({ event: 'worker_shutdown_error', worker: 'telegram-worker', error: err });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

logger.info({ event: 'worker_started', worker: 'telegram-worker' });
