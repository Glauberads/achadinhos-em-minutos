import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const CREATIVE_RENDER_QUEUE = 'creative-render';

export const creativeRenderQueue = new Queue(CREATIVE_RENDER_QUEUE, {
  connection: redisConnection,
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

export const addCreativeRenderJob = async (creativeId: string, userId: string) => {
  return await creativeRenderQueue.add(
    'render',
    { creativeId, userId },
    { jobId: `render:${creativeId}` }
  );
};
