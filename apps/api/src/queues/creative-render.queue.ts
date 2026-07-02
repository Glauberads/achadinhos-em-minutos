import { Queue } from 'bullmq';
import { bullMQConnection } from '../lib/redis';

export const CREATIVE_RENDER_QUEUE = 'creative-render';

let creativeRenderQueue: Queue | null = null;

try {
  creativeRenderQueue = new Queue(CREATIVE_RENDER_QUEUE, {
    connection: bullMQConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
} catch (err) {
  console.warn('[CreativeRenderQueue] Could not initialize queue (Redis unavailable):', (err as Error).message);
}

export const addCreativeRenderJob = async (creativeId: string, userId: string) => {
  if (!creativeRenderQueue || bullMQConnection.status !== 'ready') {
    console.warn('[CreativeRenderQueue] Queue or Redis not available, skipping render job for:', creativeId);
    throw new Error('Redis indisponível para BullMQ');
  }
  return await creativeRenderQueue.add(
    'render',
    { creativeId, userId },
    { jobId: `render:${creativeId}` }
  );
};

export { creativeRenderQueue };
