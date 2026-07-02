import { MarketIntelligenceInputDTO, MarketIntelligenceOutputDTO, marketIntelligenceSchema, marketIntelligenceOutputSchema } from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';
import { aiProvider } from '../providers/ai/ai-factory';

export class MarketIntelligenceService {
  /**
   * Analisa nicho e dados de mercado.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   * Usa MOCK na fase atual (Bloco 2).
   */
  async analyze(input: MarketIntelligenceInputDTO): Promise<MarketIntelligenceOutputDTO> {
    // 1. Feature Flag Check
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');
    
    // Validate Input
    const parsedInput = marketIntelligenceSchema.parse(input);

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', niche: parsedInput.niche } });
      return this.getFallbackAnalysis();
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', niche: parsedInput.niche } });

      const prompt = `
        Aja como um especialista em Neuromarketing e Vendas de Alta Conversão.
        O nicho do produto é: ${parsedInput.niche}
        O preço é: R$ ${parsedInput.price ?? 'Desconhecido'}

        Responda ESTRITAMENTE num objeto JSON com as seguintes chaves:
        - targetAudience (string): Quem é o público ideal (ex: "Mulheres de 25-45 anos").
        - painPoints (array de string): As 3 maiores dores que esse produto resolve.
        - marketTrends (array de string): As 2 maiores tendências de compra deste nicho hoje.
      `;

      const responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      const parsedAi = JSON.parse(cleanJson);

      const mockResult: MarketIntelligenceOutputDTO = {
        targetAudience: parsedAi.targetAudience ?? 'Público Geral',
        painPoints: parsedAi.painPoints ?? ['Dores não encontradas'],
        marketTrends: parsedAi.marketTrends ?? ['Alta conversão']
      };

      // Validate Output
      const validatedOutput = marketIntelligenceOutputSchema.parse(mockResult);
      
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        niche: parsedInput.niche,
        mode: 'mock'
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: {
        niche: parsedInput.niche
      }});
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis(): MarketIntelligenceOutputDTO {
    return {
      targetAudience: 'Geral',
      painPoints: ['Preço alto'],
      marketTrends: ['Comodidade']
    };
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();
