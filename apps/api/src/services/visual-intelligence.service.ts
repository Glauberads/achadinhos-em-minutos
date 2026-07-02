import { VisualIntelligenceInputDTO, VisualIntelligenceOutputDTO, visualIntelligenceSchema, visualIntelligenceOutputSchema } from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';
import { aiProvider } from '../providers/ai/ai-factory';

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

      let base64Image: string | undefined;
      let mimeType: string = 'image/jpeg';

      if (parsedInput.imageUrl) {
        try {
          const imgResponse = await fetch(parsedInput.imageUrl);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            base64Image = Buffer.from(arrayBuffer).toString('base64');
            mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
          }
        } catch (err) {
          console.warn('[Visual Intelligence] Failed to fetch image, using text-only fallback', err);
        }
      }

      const prompt = `
        Analise esta imagem de produto para e-commerce.
        Título original: ${parsedInput.productName || 'Desconhecido'}

        Responda ESTRITAMENTE num objeto JSON com os seguintes campos:
        - hasFace (boolean): true se houver uma pessoa ou rosto visível.
        - dominantColors (array de string): 2 a 3 cores em formato HEX predominantes.
        - qualityScore (number): nota de 0 a 100 estimando a qualidade visual/resolução.
        - suggestedFocus (string): breve descrição de onde o foco do layout deve ficar (ex: "Produto no centro").
      `;

      let responseText: string;
      if (base64Image) {
        responseText = await aiProvider.generateContent(prompt, { 
          jsonMode: true, 
          image: { mimeType, data: base64Image } 
        });
      } else {
        responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      }

      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      const parsedAi = JSON.parse(cleanJson);

      const mockResult: VisualIntelligenceOutputDTO = {
        hasFace: parsedAi.hasFace ?? false,
        dominantColors: parsedAi.dominantColors ?? ['#000000', '#FFFFFF'],
        qualityScore: parsedAi.qualityScore ?? 75,
        suggestedFocus: parsedAi.suggestedFocus ?? 'Produto'
      };

      // Validate Output
      const validatedOutput = visualIntelligenceOutputSchema.parse(mockResult);
      
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        url: parsedInput.imageUrl,
        mode: 'real_ai',
        qualityScore: validatedOutput.qualityScore
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
