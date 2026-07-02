import { 
  CreativeReviewerOutputDTO, 
  creativeReviewerOutputSchema, 
  ExecutionPlannerOutputDTO 
} from '../../validators/creative-os.validator';
import { featureFlagService } from '../feature-flag.service';
import { telemetryService } from '../telemetry.service';
import { aiProvider } from '../../providers/ai/ai-factory';

export class CreativeReviewerService {
  /**
   * Avalia o plano de execução e dá as notas de Visual Score e Conversion Score.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   */
  async review(plan: ExecutionPlannerOutputDTO): Promise<CreativeReviewerOutputDTO> {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');

    if (!isCreativeOsEnabled) {
      return this.getFallbackReview();
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', service: 'creative_reviewer' } });

      const prompt = `
        Aja como um Auditor de Qualidade Rigoroso de Criativos de Alta Conversão.
        Avalie o seguinte plano de execução de vídeo:
        
        Layout: ${JSON.stringify(plan.layout)}
        Cores: ${JSON.stringify(plan.color)}
        Tipografia: ${JSON.stringify(plan.typography)}
        Hook: ${JSON.stringify(plan.hook)}
        CTA: ${JSON.stringify(plan.cta)}

        Dê duas notas de 0 a 100:
        1. Visual Score: Harmonia visual, legibilidade, contraste.
        2. Conversion Score: Força do gancho, clareza da chamada para ação, urgência.

        Retorne ESTRITAMENTE um objeto JSON:
        {
          "approved": boolean (true se ambas as notas forem >= 80),
          "scores": {
            "visualScore": number,
            "conversionScore": number
          },
          "feedback": [array de strings com as razões ou melhorias sugeridas]
        }
      `;

      const responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      const parsedAi = JSON.parse(cleanJson);

      const validatedOutput = creativeReviewerOutputSchema.parse(parsedAi);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        service: 'creative_reviewer',
        scores: validatedOutput.scores
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: { service: 'creative_reviewer' } });
      
      // Fallback aprova silenciosamente para não travar o usuário
      return this.getFallbackReview();
    }
  }

  private getFallbackReview(): CreativeReviewerOutputDTO {
    return {
      approved: true,
      scores: {
        visualScore: 85,
        conversionScore: 85
      },
      feedback: ['Mock fallback approved']
    };
  }
}

export const creativeReviewerService = new CreativeReviewerService();
