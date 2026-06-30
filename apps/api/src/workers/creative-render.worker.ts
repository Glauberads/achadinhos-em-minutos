import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { CREATIVE_RENDER_QUEUE } from '../queues/creative-render.queue';
import { videoRenderService } from '../services/video-render.service';
import { creativeRepository } from '../repositories/creative.repository';
import { eventBus, CreativeRenderStartedEvent, CreativeRenderFinishedEvent, CreativeGeneratedEvent, CreativeRenderFailedEvent } from '../events';
import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

import { telemetryService } from '../services/telemetry.service';

export const creativeRenderWorker = new Worker(
  CREATIVE_RENDER_QUEUE,
  async (job: Job<{ creativeId: string; userId: string }>) => {
    const { creativeId, userId } = job.data;
    
    console.log(`[CreativeRenderWorker] Starting job ${job.id} for creative ${creativeId}`);

    const queueTimeMs = Date.now() - job.timestamp;

    await telemetryService.measure('WORKER_JOB', async () => {
      // 1. Atualizar status
      await creativeRepository.updateStatus(creativeId, 'generating', 'rendering');
      eventBus.emit(new CreativeRenderStartedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));

      // 2. Obter dados do criativo
      const creative = await creativeRepository.findById(creativeId, userId);
      if (!creative) throw new Error('Criativo não encontrado');

      // 3. Renderizar Vídeo
      const result = await telemetryService.measure('FFMPEG_RENDER', async () => {
        return await videoRenderService.renderVideo(creativeId, creative.scenes || []);
      }, { user_id: userId });

      let videoUrl: string | undefined = undefined;
      let thumbnailUrl: string | undefined = undefined;
      let generationStatus = 'ready';

      // 4. Se for fallback
      if ('isFallback' in result && result.isFallback) {
        generationStatus = 'ready_with_fallback';
        // Mock fallback URLs since we didn't generate actual files
        thumbnailUrl = creative.image_urls?.[0] || '';
      } else {
        // 5. Uploading files to Supabase Storage
        const videoBuffer = fs.readFileSync((result as any).videoPath);
        const videoExt = path.extname((result as any).videoPath);
        const videoFileName = `${userId}/${creativeId}${videoExt}`;
        
        const thumbBuffer = fs.readFileSync((result as any).thumbnailPath);
        const thumbExt = path.extname((result as any).thumbnailPath);
        const thumbFileName = `${userId}/${creativeId}${thumbExt}`;

        // Upload Vídeo
        const { error: vidError } = await supabaseAdmin.storage.from('creative-videos').upload(videoFileName, videoBuffer, { upsert: true, contentType: 'video/mp4' });
        if (vidError) throw new Error(`Falha ao enviar vídeo: ${vidError.message}`);

        // Upload Thumbnail
        const { error: thumbError } = await supabaseAdmin.storage.from('creative-thumbnails').upload(thumbFileName, thumbBuffer, { upsert: true, contentType: 'image/jpeg' });
        if (thumbError) throw new Error(`Falha ao enviar thumbnail: ${thumbError.message}`);

        // Get public URLs
        const { data: vidData } = supabaseAdmin.storage.from('creative-videos').getPublicUrl(videoFileName);
        const { data: thumbData } = supabaseAdmin.storage.from('creative-thumbnails').getPublicUrl(thumbFileName);

        videoUrl = vidData.publicUrl;
        thumbnailUrl = thumbData.publicUrl;

        // Limpeza dos arquivos locais temporários
        try { fs.rmSync(path.dirname((result as any).videoPath), { recursive: true, force: true }); } catch (e) {}
      }

      // 6. Atualizar DB
      await creativeRepository.update(creativeId, userId, {
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        status: generationStatus === 'ready_with_fallback' ? 'ready_with_fallback' : 'ready',
        generation_status: generationStatus
      });

      eventBus.emit(new CreativeRenderFinishedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));
      eventBus.emit(new CreativeGeneratedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));

    }, { 
      user_id: userId, 
      queue_time_ms: queueTimeMs,
      metadata: { creative_id: creativeId }
    }).catch(async (error) => {
      console.error(`[CreativeRenderWorker] Failed job ${job.id}`, error);
      
      const errorMessage = (error as Error).message;
      await creativeRepository.updateStatus(creativeId, 'failed', 'failed', errorMessage);
      
      eventBus.emit(new CreativeRenderFailedEvent({ creative_id: creativeId, error_message: errorMessage }, { user_id: userId, source: 'CreativeRenderWorker' }));

      throw error;
    });
  },
  { connection: redisConnection }
);

creativeRenderWorker.on('failed', (job, err) => {
  console.error(`[CreativeRenderWorker] Job ${job?.id} has failed with ${err.message}`);
});
