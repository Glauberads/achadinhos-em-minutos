import { 
  CreativeStrategyInputDTO, 
  CreativeStrategyOutputDTO, 
  creativeStrategySchema, 
  creativeStrategyOutputSchema 
} from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';
import { aiProvider } from '../providers/ai/ai-factory';

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

      const prompt = `
        Aja como o Diretor de Estratégia de uma agência de marketing de conversão.
        Sua função é consolidar o DNA Criativo do produto baseado nos seguintes insumos:
        - Dados Visuais: Rosto Humano: ${parsedInput.visualData.hasFace}, Qualidade: ${parsedInput.visualData.qualityScore}, Foco: ${parsedInput.visualData.suggestedFocus}
        - Mercado: Dores: ${parsedInput.marketData.painPoints.join(', ')}, Público: ${parsedInput.marketData.targetAudience}
        - Plataforma: Boas práticas: ${parsedInput.creativeData.bestPractices.join(', ')}

        Retorne ESTRITAMENTE um objeto JSON contendo:
        - angle (string): O ângulo de vendas principal.
        - toneOfVoice (string): O tom de voz (ex: "Urgente e Empático").
        - durationSeconds (number): A duração ideal do vídeo em segundos (ex: 15).
        - coreMessage (string): A mensagem principal que deve ficar clara em uma frase.
      `;

      const responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      const parsedAi = JSON.parse(cleanJson);

      const mockResult: CreativeStrategyOutputDTO = {
        angle: parsedAi.angle ?? 'Desconto Imperdível',
        toneOfVoice: parsedAi.toneOfVoice ?? 'Urgente',
        durationSeconds: parsedAi.durationSeconds ?? 15,
        coreMessage: parsedAi.coreMessage ?? 'Compre agora.'
      };

      const validatedOutput = creativeStrategyOutputSchema.parse(mockResult);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        angle: validatedOutput.angle,
        mode: 'real_ai'
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
