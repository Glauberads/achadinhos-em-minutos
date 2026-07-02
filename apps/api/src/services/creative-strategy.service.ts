import { 
  CreativeStrategyInputDTO, 
  CreativeStrategyOutputDTO, 
  creativeStrategySchema, 
  creativeStrategyOutputSchema 
} from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';

export class CreativeStrategyService {
  /**
   * Cérebro Maior - Consolida Inteligência Visual, Mercado e Criativa.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   * Usa MOCK na fase atual (Bloco 2).
   */
  async buildStrategy(input: CreativeStrategyInputDTO): Promise<CreativeStrategyOutputDTO> {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');
    const parsedInput = creativeStrategySchema.parse(input);

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', reason: 'flag_disabled' } });
      return this.getFallbackStrategy();
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { 
        action: 'started',
        hasFace: parsedInput.visualData.hasFace,
        targetAudience: parsedInput.marketData.targetAudience
      }});

      // MOCK IMPLEMENTATION (Block 2)
      // Consolidação simulada
      let angle = 'Oferta Irresistível';
      let toneOfVoice = 'Urgente e Empolgante';
      let durationSeconds = 15;
      let coreMessage = 'Compre agora antes que acabe!';

      // Simular lógica de cruzamento
      if (parsedInput.marketData.painPoints.length > 0) {
        angle = `Solução para ${parsedInput.marketData.painPoints[0]}`;
        toneOfVoice = 'Empático e Direto';
      }

      if (parsedInput.creativeData.bestPractices.some(bp => bp.toLowerCase().includes('rápido'))) {
        durationSeconds = 10;
      }

      if (parsedInput.visualData.qualityScore > 90) {
        coreMessage = 'Qualidade Premium garantida.';
        toneOfVoice = 'Sofisticado';
      }

      const mockResult: CreativeStrategyOutputDTO = {
        angle,
        toneOfVoice,
        durationSeconds,
        coreMessage
      };

      const validatedOutput = creativeStrategyOutputSchema.parse(mockResult);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        angle,
        mode: 'mock'
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message });
      return this.getFallbackStrategy();
    }
  }

  private getFallbackStrategy(): CreativeStrategyOutputDTO {
    return {
      angle: 'Desconto Exclusivo',
      toneOfVoice: 'Urgente',
      durationSeconds: 15,
      coreMessage: 'Aproveite enquanto dura.'
    };
  }
}

export const creativeStrategyService = new CreativeStrategyService();
