import { marketingBrainService } from './marketing-brain.service';
import { creativeIntelligenceService } from './creative-intelligence.service';
import { templateEngineService } from './template-engine.service';
import { hookEngineService } from './hook-engine.service';
import { ctaEngineService } from './cta-engine.service';

import { telemetryService } from './telemetry.service';

export interface PlannedCreative {
  product: any;
  intelligence: any;
  strategy: any;
  dna: any;
  script: any[];
  scenes: any[];
}

export class CreativePlannerService {
  async planCreative(product: any): Promise<PlannedCreative> {
    return telemetryService.measure('AI_GENERATION', async () => {
      // 1. Intelligence Analysis (Deep Product/Audience understanding)
      const intelligence = await creativeIntelligenceService.analyzeProduct(product);

      // 2. Marketing Strategy
      const strategy = await marketingBrainService.determineStrategy(product, intelligence);

    // 3. Template Selection
    const template = templateEngineService.selectTemplate(strategy, product.category || 'Geral');

    // 4. Hook & CTA Generation
    const hook = hookEngineService.generateHook(intelligence, strategy);
    const cta = ctaEngineService.generateCTA(intelligence, strategy);

    // 5. Creative DNA Assembly
    const dna = {
      emotion: strategy.emotion,
      mental_trigger: strategy.mental_trigger,
      style: template.animation_style,
      template: template.id,
      hook,
      cta,
      color_strategy: template.default_colors.join(','),
      duration: strategy.duration_seconds
    };

    // 6. Base Script & Scenes Assembly (Copy Engine simplified logic)
    const images = product.images || [];
    const script = [
      { id: 'scene-1', start_time: 0, end_time: 3, text: hook },
      { id: 'scene-2', start_time: 3, end_time: strategy.duration_seconds - 3, text: strategy.main_promise },
      { id: 'scene-3', start_time: strategy.duration_seconds - 3, end_time: strategy.duration_seconds, text: cta }
    ];

    const scenes = [
      {
        id: 'scene-1',
        type: 'image',
        url: images[0] || '',
        duration: 3,
        animation: template.animation_style === 'aggressive' ? 'zoom-in-fast' : 'zoom-in',
        text: hook,
        colors: template.default_colors
      },
      {
        id: 'scene-2',
        type: 'image',
        url: images[1] || images[0] || '',
        duration: strategy.duration_seconds - 6,
        animation: 'pan-right',
        text: strategy.main_promise,
        colors: template.default_colors
      },
      {
        id: 'scene-3',
        type: 'image',
        url: images[2] || images[0] || '',
        duration: 3,
        animation: 'fade',
        text: cta,
        colors: template.default_colors
      }
    ];

      return {
        product,
        intelligence,
        strategy,
        dna,
        script,
        scenes
      };
    });
  }
}

export const creativePlannerService = new CreativePlannerService();
