import { supabaseAdmin } from '../lib/supabase';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';
import { LearningEngineInputDTO, LearningEngineOutputDTO, learningEngineSchema, learningEngineOutputSchema } from '../validators/creative-os.validator';
export interface CreativeAnalyticsPayload {
  creative_id: string;
  user_id: string;
  marketplace: string;
  category: string;
  template_used: string;
  hook_used: string;
  cta_used: string;
  emotion_used: string;
  mental_trigger: string;
  visual_style: string;
  duration_seconds: number;
  predominant_color: string;
  publish_time: string; // ISO string
  day_of_week: string;
  views?: number;
  clicks?: number;
  conversions?: number;
  watch_time_avg?: number;
}

export class LearningEngineService {
  /**
   * [NOVO FLUXO - CREATIVE OS]
   * Registra e aprende com a performance dos criativos.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   */
  async learnFromCreativeOS(input: LearningEngineInputDTO): Promise<LearningEngineOutputDTO> {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');
    const parsedInput = learningEngineSchema.parse(input);

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', creativeId: parsedInput.creativeId } });
      return { success: false, insightsGenerated: 0 };
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', creativeId: parsedInput.creativeId } });

      // MOCK IMPLEMENTATION (Block 2)
      // Simula a geração de insights baseada nos dados passados
      let insights = 0;
      if (parsedInput.performanceMetrics.ctr > 2) {
        insights = 2; // Simula a descoberta de 2 padrões
      }

      const mockResult: LearningEngineOutputDTO = {
        success: true,
        insightsGenerated: insights
      };

      const validatedOutput = learningEngineOutputSchema.parse(mockResult);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        creativeId: parsedInput.creativeId,
        mode: 'stub',
        insights
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: {
        creativeId: parsedInput.creativeId
      }});
      return { success: false, insightsGenerated: 0 };
    }
  }

  async registerMetrics(payload: CreativeAnalyticsPayload) {
    const ctr = payload.views ? (payload.clicks || 0) / payload.views * 100 : 0;

    const { error } = await supabaseAdmin
      .from('creative_analytics')
      .insert([{
        ...payload,
        ctr: ctr.toFixed(2)
      }]);

    if (error) {
      console.error('LearningEngine Error: Could not save metrics', error);
      throw error;
    }
  }

  async getBestHookForCategory(category: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('creative_analytics')
      .select('hook_used, ctr, conversions')
      .eq('category', category)
      .order('conversions', { ascending: false })
      .order('ctr', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.hook_used;
  }
}

export const learningEngineService = new LearningEngineService();
