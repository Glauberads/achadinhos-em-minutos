import { supabaseAdmin } from '../lib/supabase';

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
