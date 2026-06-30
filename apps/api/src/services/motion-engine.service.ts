export interface MotionConfig {
  animationType: string;
  durationSeconds: number;
}

export class MotionEngineService {
  /**
   * Generates complex FFmpeg filter graphs based on agnostic animation parameters.
   */
  generateFilterGraph(config: MotionConfig, inputIndex: number): string {
    switch (config.animationType) {
      case 'zoom-in':
        // Zoom in from 1x to 1.5x over duration
        return `[${inputIndex}:v]scale=1280x1920,zoompan=z='min(zoom+0.0015,1.5)':d=${config.durationSeconds * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[v${inputIndex}]`;
      case 'zoom-in-fast':
        // Aggressive zoom
        return `[${inputIndex}:v]scale=1280x1920,zoompan=z='min(zoom+0.003,2.0)':d=${config.durationSeconds * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[v${inputIndex}]`;
      case 'pan-right':
        // Pan from left to right
        return `[${inputIndex}:v]scale=1280x1920,zoompan=x='min(x+2,1280)':y=0:d=${config.durationSeconds * 25}[v${inputIndex}]`;
      case 'fade':
        // Static with fade in/out (fade out near end)
        return `[${inputIndex}:v]scale=1280x1920,fade=t=in:st=0:d=1,fade=t=out:st=${config.durationSeconds - 1}:d=1[v${inputIndex}]`;
      default:
        // Default static scale
        return `[${inputIndex}:v]scale=1280x1920[v${inputIndex}]`;
    }
  }
}

export const motionEngineService = new MotionEngineService();
