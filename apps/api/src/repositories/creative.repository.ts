import { supabaseAdmin } from '../lib/supabase';

export interface CreativeData {
  id?: string;
  user_id: string;
  product_id?: string;
  marketplace: string;
  product_url: string;
  affiliate_link?: string;
  title?: string;
  description?: string;
  script?: any;
  scenes?: any;
  thumbnail_url?: string;
  video_url?: string;
  image_urls?: string[];
  status?: string;
  generation_status?: string;
  error_message?: string | null;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  // V2 Fields
  parent_id?: string | null;
  buyer_persona?: any;
  creative_dna?: any;
  quality_scores?: any;
  conversion_score?: number;
}

export class CreativeRepository {
  async create(data: CreativeData) {
    const { data: creative, error } = await supabaseAdmin
      .from('creatives')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return creative;
  }

  async findById(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('creatives')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async findByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('creatives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, updates: Partial<CreativeData>) {
    const { data, error } = await supabaseAdmin
      .from('creatives')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: string, generation_status: string, error_message: string | null = null) {
    // Used by Service Role in workers, bypasses user_id check
    const { data, error } = await supabaseAdmin
      .from('creatives')
      .update({ 
        status, 
        generation_status, 
        error_message, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('creatives')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const creativeRepository = new CreativeRepository();
