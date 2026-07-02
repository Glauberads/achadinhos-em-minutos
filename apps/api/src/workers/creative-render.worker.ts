import { Worker, Job } from 'bullmq';
import { bullMQConnection } from '../lib/redis';
import { CREATIVE_RENDER_QUEUE } from '../queues/creative-render.queue';
import { videoRenderService } from '../services/video-render.service';
import { creativeRepository } from '../repositories/creative.repository';
import { eventBus, CreativeRenderStartedEvent, CreativeRenderFinishedEvent, CreativeGeneratedEvent, CreativeRenderFailedEvent } from '../events';
import { supabaseAdmin } from '../lib/supabase';
import { telemetryService } from '../services/telemetry.service';
import fs from 'fs';
import path from 'path';

// Worker wrappado em try-catch para não crashar o servidor se Redis estiver indisponível
let creativeRenderWorker: Worker | null = null;

try {
  creativeRenderWorker = new Worker(
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

        // 3. Renderizar o vídeo
        const videoResult = await videoRenderService.renderVideo(creative.id, creative.scenes || []);
        
        let videoUrl: string | null = null;
        let thumbnailUrl: string | null = null;

        // 4. Upload para Storage se houve arquivo gerado
        if (!('isFallback' in videoResult) && videoResult.videoPath) {
          try {
            const fileBuffer = fs.readFileSync(videoResult.videoPath);
            const fileName = `${creativeId}/${Date.now()}.mp4`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('creative-videos')
              .upload(fileName, fileBuffer, { contentType: 'video/mp4', upsert: true });

            if (!uploadError && uploadData) {
              const { data: urlData } = supabaseAdmin.storage.from('creative-videos').getPublicUrl(uploadData.path);
              videoUrl = urlData.publicUrl;
            }
            
            // Limpar arquivo temporário
            try { fs.unlinkSync(videoResult.videoPath); } catch {}
          } catch (storageErr) {
            console.error('[CreativeRenderWorker] Storage upload failed:', storageErr);
          }
        }

        if (!('isFallback' in videoResult)) {
          // Sucesso real
          await creativeRepository.update(creativeId, userId, {
            video_url: videoUrl || undefined,
            thumbnail_url: thumbnailUrl || undefined,
            status: 'published',
            generation_status: 'ready',
          });
          
          eventBus.emit(new CreativeGeneratedEvent({ creative_id: creativeId }, { user_id: userId, source: 'CreativeRenderWorker' }));
        } else {
          // Fallback: storyboard estático
          await creativeRepository.update(creativeId, userId, {
            thumbnail_url: creative.image_urls?.[0] || undefined,
            status: 'draft',
            generation_status: 'ready_with_fallback',
          });
        }
      });
    },
    { connection: bullMQConnection }
  );

  creativeRenderWorker.on('failed', (job, err) => {
    console.error(`[CreativeRenderWorker] Job ${job?.id} has failed with ${err.message}`);
  });

  console.log('[CreativeRenderWorker] Worker initialized successfully');
} catch (err) {
  console.warn('[CreativeRenderWorker] Could not initialize worker (Redis unavailable). Render jobs will be queued when Redis comes online:', (err as Error).message);
}

export { creativeRenderWorker };
