import { logger } from '../lib/logger';
import dotenv from 'dotenv';
dotenv.config();

// Carrega o worker que renderiza os vídeos usando fluent-ffmpeg
import './creative-render.worker';

const shutdown = async (signal: string) => {
  logger.info({ event: 'worker_shutdown_initiated', worker: 'ffmpeg-worker', signal });
  try {
    const { cacheService } = await import('../services/cache.service');
    if (cacheService) await cacheService.quit();
    
    // Como FFmpeg pode estar rodando, o Graceful shutdown ideal no futuro
    // chamará o close() do worker do BullMQ para esperar os jobs terminarem.
    const { creativeRenderWorker } = await import('./creative-render.worker');
    if (creativeRenderWorker) await creativeRenderWorker.close();
    
    logger.info({ event: 'worker_shutdown_complete', worker: 'ffmpeg-worker' });
    process.exit(0);
  } catch (err) {
    logger.error({ event: 'worker_shutdown_error', worker: 'ffmpeg-worker', error: err });
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

logger.info({ event: 'worker_started', worker: 'ffmpeg-worker' });
