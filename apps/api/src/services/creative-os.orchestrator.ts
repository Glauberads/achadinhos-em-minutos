import { visualIntelligenceService } from './visual-intelligence.service';
import { marketIntelligenceService } from './market-intelligence.service';
import { creativeIntelligenceService } from './creative-intelligence.service';
import { creativeStrategyService } from './creative-strategy.service';
import { executionPlannerService } from './engines/execution-planner.service';
import { creativeReviewerService } from './engines/creative-reviewer.service';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';
import { ExecutionPlannerOutputDTO } from '../validators/creative-os.validator';

export interface CreativeOsInput {
  imageUrl?: string;
  productName?: string;
  niche: string;
  price?: number;
  platform: 'tiktok' | 'reels' | 'shorts';
  audience?: string;
}

export class CreativeOsOrchestrator {
  /**
   * Orquestra todo o pipeline V3 do Creative OS (Bloco 3).
   * Possui retentativas automáticas no Reviewer (Dual Score).
   */
  async generate(input: CreativeOsInput) {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', service: 'orchestrator' } });
      throw new Error('Creative OS is disabled. Use V2 pipeline fallback.');
    }

    const startTime = performance.now();

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', service: 'orchestrator', input } });

      // 1. Coleta de Insumos (Paralelo)
      const [visualData, marketData, creativeData] = await Promise.all([
        visualIntelligenceService.analyze({ imageUrl: input.imageUrl || '', productName: input.productName }),
        marketIntelligenceService.analyze({ niche: input.niche, price: input.price }),
        creativeIntelligenceService.analyzeForCreativeOS({ platform: input.platform, audience: input.audience || 'Geral' })
      ]);

      // 2. Estratégia
      const strategy = await creativeStrategyService.buildStrategy({
        visualData,
        marketData,
        creativeData
      });

      // 3. Execução & Validação (Com retentativas)
      let bestPlan: ExecutionPlannerOutputDTO | null = null;
      let bestScores = { visualScore: 0, conversionScore: 0 };
      let attempts = 0;
      const MAX_ATTEMPTS = 3; // 1 tentativa normal + 2 refinamentos

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Passa a estratégia para o Execution Planner. 
        // Se for uma retentativa, o ideal seria passar o feedback do reviewer no prompt, 
        // mas manteremos simples nesta fase: apenas chamamos de novo para ver se o LLM gera algo melhor.
        const plan = await executionPlannerService.planExecution(strategy);
        const review = await creativeReviewerService.review(plan);

        // Track best plan
        const avgScore = (review.scores.visualScore + review.scores.conversionScore) / 2;
        const currentBestAvg = (bestScores.visualScore + bestScores.conversionScore) / 2;

        if (avgScore >= currentBestAvg || bestPlan === null) {
          bestPlan = plan;
          bestScores = review.scores;
        }

        if (review.approved) {
          telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'review_approved', attempts } });
          break;
        } else {
          telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'review_failed', attempts, feedback: review.feedback } });
        }
      }

      const totalTime = Math.round(performance.now() - startTime);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: totalTime, metadata: { 
        action: 'completed',
        service: 'orchestrator',
        refinement_attempts: attempts - 1,
        visual_score: bestScores.visualScore,
        conversion_score: bestScores.conversionScore,
        creative_os_mode: 'real_ai'
      }});

      return {
        strategy,
        execution: bestPlan,
        metadata: {
          visual_score: bestScores.visualScore,
          conversion_score: bestScores.conversionScore,
          refinement_attempts: attempts - 1,
          creative_os_mode: 'real_ai'
        }
      };

    } catch (error: any) {
      const totalTime = Math.round(performance.now() - startTime);
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: totalTime, error_message: error.message, metadata: { service: 'orchestrator' } });
      throw error; // Let the controller handle the fallback to V2
    }
  }
}

export const creativeOsOrchestrator = new CreativeOsOrchestrator();
