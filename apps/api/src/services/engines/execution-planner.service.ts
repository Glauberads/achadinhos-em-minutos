import { 
  CreativeStrategyOutputDTO, 
  ExecutionPlannerOutputDTO, 
  executionPlannerOutputSchema 
} from '../../validators/creative-os.validator';
import { featureFlagService } from '../feature-flag.service';
import { telemetryService } from '../telemetry.service';
import { aiProvider } from '../../providers/ai/ai-factory';

export class ExecutionPlannerService {
  /**
   * Ponto único de execução para gerar Layout, Tipografia, Cor, Hook, CTA e Storyboard.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   */
  async planExecution(strategy: CreativeStrategyOutputDTO): Promise<ExecutionPlannerOutputDTO> {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', service: 'execution_planner' } });
      return this.getFallbackExecution(strategy);
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', service: 'execution_planner' } });

      const prompt = `
        Aja como o Diretor de Arte e Copywriter Sênior.
        Com base no seguinte DNA Criativo, gere os parâmetros exatos de execução do vídeo:
        
        DNA Criativo:
        - Ângulo: ${strategy.angle}
        - Tom de Voz: ${strategy.toneOfVoice}
        - Duração Ideal: ${strategy.durationSeconds}s
        - Mensagem Central: ${strategy.coreMessage}

        Retorne ESTRITAMENTE um objeto JSON que obedeça à seguinte estrutura rigorosa:
        {
          "layout": { "paddingTop": number, "paddingBottom": number, "safeZones": boolean, "imageAlignment": "center" | "top" | "bottom" | "fill" },
          "typography": { "primaryFont": string, "secondaryFont": string, "baseSize": number, "weight": string },
          "color": { "primaryColor": string, "accentColor": string, "textColor": string, "backgroundColor": string },
          "hook": { "text": string, "duration": number, "visualCue": string },
          "cta": { "text": string, "urgencyLevel": "low" | "medium" | "high" },
          "storyboard": { "scenes": [ { "id": string, "duration": number, "textOverlay": string, "voiceover": string } ] },
          "motion": { "transitions": [ { "sceneId": string, "type": string, "durationMs": number } ] }
        }
      `;

      const responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
      const parsedAi = JSON.parse(cleanJson);

      // Safe Parse
      const validatedOutput = executionPlannerOutputSchema.parse(parsedAi);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        service: 'execution_planner'
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: { service: 'execution_planner' } });
      
      // Fallback seguro caso falhe no parse ou timeout
      return this.getFallbackExecution(strategy);
    }
  }

  private getFallbackExecution(strategy: CreativeStrategyOutputDTO): ExecutionPlannerOutputDTO {
    return {
      layout: { paddingTop: 20, paddingBottom: 20, safeZones: true, imageAlignment: 'center' },
      typography: { primaryFont: 'Inter', secondaryFont: 'Roboto', baseSize: 32, weight: 'bold' },
      color: { primaryColor: '#000000', accentColor: '#FF0000', textColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
      hook: { text: 'Pare de rolar a tela!', duration: 3, visualCue: 'Seta apontando pro produto' },
      cta: { text: 'Compre com Desconto', urgencyLevel: 'high' },
      storyboard: {
        scenes: [{ id: 'scene-1', duration: strategy.durationSeconds, textOverlay: strategy.coreMessage, voiceover: 'Confira agora!' }]
      },
      motion: {
        transitions: [{ sceneId: 'scene-1', type: 'fade', durationMs: 500 }]
      }
    };
  }
}

export const executionPlannerService = new ExecutionPlannerService();
