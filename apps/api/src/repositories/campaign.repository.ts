import { supabaseAdmin } from '../lib/supabase';

/**
 * CampaignRepository — Centraliza todo acesso a dados da tabela `campaigns`.
 * 
 * Usado pelas rotas de campaigns e pelo Campaign Runner worker.
 */
export class CampaignRepository {

  /**
   * Cria uma nova campanha.
   */
  async create(data: Record<string, any>) {
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert(data)
      .select()
      .single();

    return { data: campaign, error };
  }

  /**
   * Lista campanhas de um usuário com o nome do grupo associado.
   */
  async findByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*, telegram_group:groups(group_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }

  /**
   * Busca campanha ativa por ID.
   */
  async findActiveById(campaignId: string) {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('status', 'active')
      .single();

    return { data, error };
  }

  /**
   * Atualiza campos de uma campanha, validando ownership.
   */
  async update(campaignId: string, userId: string, updates: Record<string, any>) {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Atualiza o status de uma campanha.
   */
  async updateStatus(campaignId: string, userId: string, status: string, extraFields?: Record<string, any>) {
    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
      ...extraFields,
    };

    return this.update(campaignId, userId, updates);
  }

  /**
   * Atualiza next_run_at após execução do worker.
   */
  async updateNextRun(campaignId: string, nextRunAt: string) {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return { error };
  }

  /**
   * Conta campanhas ativas de um usuário.
   */
  async countActiveByUser(userId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    return count || 0;
  }
}

// Singleton para reutilização
export const campaignRepository = new CampaignRepository();
