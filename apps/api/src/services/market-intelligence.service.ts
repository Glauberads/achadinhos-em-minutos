import { MarketIntelligenceInputDTO, MarketIntelligenceOutputDTO, marketIntelligenceSchema, marketIntelligenceOutputSchema } from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';

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

      // TODO (Block 3): Integrar com OpenAI / Market APIs
      
      // MOCK IMPLEMENTATION (Block 2)
      let targetAudience = 'Público Geral';
      const painPoints: string[] = [];
      const marketTrends: string[] = ['Vídeos curtos estilo UGC', 'Prova social forte'];

      const nicheLower = parsedInput.niche.toLowerCase();
      
      if (nicheLower.includes('beleza') || nicheLower.includes('skincare')) {
        targetAudience = 'Mulheres 18-35 anos';
        painPoints.push('Problemas de pele', 'Falta de tempo para rotina longa', 'Preço alto de produtos importados');
        marketTrends.push('Rotinas minimalistas', 'Ingredientes naturais');
      } else if (nicheLower.includes('tecnologia') || nicheLower.includes('eletrônico')) {
        targetAudience = 'Homens e Mulheres 18-40 anos';
        painPoints.push('Equipamento antigo lento', 'Cabos quebrando facilmente');
        marketTrends.push('Gadgets sem fio', 'Custo benefício');
      } else {
        painPoints.push('Preço alto no varejo tradicional', 'Desconfiança na qualidade online');
      }

      if (parsedInput.price && parsedInput.price < 50) {
        marketTrends.push('Compras por impulso');
      }

      const mockResult: MarketIntelligenceOutputDTO = {
        targetAudience,
        painPoints,
        marketTrends
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
