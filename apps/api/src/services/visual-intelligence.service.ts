import { VisualIntelligenceInputDTO, VisualIntelligenceOutputDTO, visualIntelligenceSchema, visualIntelligenceOutputSchema } from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';

export class VisualIntelligenceService {
  /**
   * Analisa uma imagem e retorna os dados visuais.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   * Usa MOCK na fase atual (Bloco 2).
   */
  async analyze(input: VisualIntelligenceInputDTO): Promise<VisualIntelligenceOutputDTO> {
    // 1. Feature Flag Check
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');
    
    // Validate Input
    const parsedInput = visualIntelligenceSchema.parse(input);

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', url: parsedInput.imageUrl } });
      return this.getFallbackAnalysis();
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', url: parsedInput.imageUrl } });

      // TODO (Block 3): Integrar com OpenAI Vision API ou Gemini
      
      // MOCK IMPLEMENTATION (Block 2)
      // Usando heurística básica pelo nome do produto ou URL
      const hasFace = parsedInput.productName?.toLowerCase().includes('modelo') || false;
      const dominantColors = ['#1E40AF', '#F3F4F6']; // Cores simuladas
      const qualityScore = Math.floor(Math.random() * (98 - 75 + 1) + 75); // Score aleatório entre 75 e 98
      
      let suggestedFocus = 'Produto no centro';
      if (hasFace) {
        suggestedFocus = 'Rosto e expressão humana';
      }

      const mockResult: VisualIntelligenceOutputDTO = {
        hasFace,
        dominantColors,
        qualityScore,
        suggestedFocus
      };

      // Validate Output
      const validatedOutput = visualIntelligenceOutputSchema.parse(mockResult);
      
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        url: parsedInput.imageUrl,
        mode: 'mock',
        qualityScore
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: {
        url: parsedInput.imageUrl
      }});
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis(): VisualIntelligenceOutputDTO {
    return {
      hasFace: false,
      dominantColors: ['#000000', '#FFFFFF'],
      qualityScore: 50,
      suggestedFocus: 'Geral'
    };
  }
}

export const visualIntelligenceService = new VisualIntelligenceService();
