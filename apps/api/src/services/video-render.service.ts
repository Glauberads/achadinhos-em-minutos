import ffmpeg from 'fluent-ffmpeg';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { eventBus, CreativeFallbackGeneratedEvent } from '../events';

export class VideoRenderService {
  async renderVideo(creativeId: string, scenes: any[]): Promise<{ videoPath: string; thumbnailPath: string } | { isFallback: true; message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Fallback robusto se cenas não existirem
        if (!scenes || scenes.length === 0) {
          throw new Error('Sem cenas para renderizar.');
        }

        // Testar se FFmpeg existe
        ffmpeg.getAvailableFormats((err) => {
          if (err) {
            console.error('[VideoRenderService] FFmpeg not found or failed, using fallback.', err);
            this.handleFallback(creativeId, err).then(resolve).catch(reject);
            return;
          }

          // FFmpeg existe, iniciar renderização real
          this.executeRender(creativeId, scenes).then(resolve).catch(err => {
            console.error('[VideoRenderService] Render failed, falling back.', err);
            this.handleFallback(creativeId, err).then(resolve).catch(reject);
          });
        });

      } catch (error) {
        this.handleFallback(creativeId, error as Error).then(resolve).catch(reject);
      }
    });
  }

  private async executeRender(creativeId: string, scenes: any[]): Promise<{ videoPath: string; thumbnailPath: string }> {
    const workDir = path.join(os.tmpdir(), `creative_${creativeId}_${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const { motionEngineService } = await import('./motion-engine.service');

    // Baixar imagens
    const localImages: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const imgPath = path.join(workDir, `img_${i}.jpg`);
      await this.downloadImage(scenes[i].url, imgPath);
      localImages.push(imgPath);
    }

    const videoPath = path.join(workDir, 'output.mp4');
    const thumbnailPath = path.join(workDir, 'thumb.jpg');

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Setup inputs
      localImages.forEach((img, i) => {
        command = command.input(img).loop(scenes[i].duration || 3);
      });

      // Filters para motion engine
      const filterGraph: string[] = [];
      localImages.forEach((_, i) => {
        const motionConfig = {
          animationType: scenes[i].animation || 'static',
          durationSeconds: scenes[i].duration || 3
        };
        filterGraph.push(motionEngineService.generateFilterGraph(motionConfig, i));
      });
      
      const concatInputs = localImages.map((_, i) => `[v${i}]`).join('');
      filterGraph.push(`${concatInputs}concat=n=${localImages.length}:v=1:a=0[outv]`);

      command
        .complexFilter(filterGraph)
        .outputOptions([
          '-map [outv]',
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-r 30'
        ])
        .save(videoPath)
        .on('end', async () => {
          // Create thumbnail
          try {
            await this.createThumbnail(localImages[0] || localImages[1], thumbnailPath);
            resolve({ videoPath, thumbnailPath });
          } catch (e) {
             // Se thumbnail falhar, copia a imagem original
             fs.copyFileSync(localImages[0], thumbnailPath);
             resolve({ videoPath, thumbnailPath });
          }
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  private async createThumbnail(imagePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(imagePath)
        .size('1080x1920')
        .outputOptions(['-vframes 1'])
        .save(destPath)
        .on('end', () => resolve())
        .on('error', reject);
    });
  }

  private async handleFallback(creativeId: string, error: Error): Promise<{ isFallback: true; message: string }> {
    eventBus.emit(new CreativeFallbackGeneratedEvent({ creative_id: creativeId, reason: error.message }, { source: 'VideoRenderService' }));

    return { isFallback: true, message: 'Gerado storyboard em imagens de fallback.' };
  }

  private async downloadImage(url: string, dest: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
  }
}

export const videoRenderService = new VideoRenderService();
