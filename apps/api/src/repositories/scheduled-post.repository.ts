import { supabaseAdmin } from '../lib/supabase';

/**
 * ScheduledPostRepository — Centraliza acesso à tabela `scheduled_posts`.
 * 
 * Usado pelo Campaign Runner e Telegram Sender workers.
 */
export class ScheduledPostRepository {

  /**
   * Cria um post agendado.
   */
  async create(data: Record<string, any>) {
    const { data: post, error } = await supabaseAdmin
      .from('scheduled_posts')
      .insert(data)
      .select()
      .single();

    return { data: post, error };
  }

  /**
   * Busca post com produto e grupo relacionados (para envio).
   */
  async findWithRelations(postId: string) {
    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, product:products(*), group:groups(*)')
      .eq('id', postId)
      .single();

    return { data, error };
  }

  /**
   * Atualiza status de um post agendado.
   */
  async updateStatus(postId: string, status: string, extraFields?: Record<string, any>) {
    const { error } = await supabaseAdmin
      .from('scheduled_posts')
      .update({
        status,
        ...extraFields,
      })
      .eq('id', postId);

    return { error };
  }

  /**
   * Conta posts pendentes/na fila de um usuário.
   */
  async countPendingByUser(userId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'queued']);

    return count || 0;
  }

  /**
   * Conta posts enviados hoje por um usuário.
   */
  async countSentToday(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString());

    return count || 0;
  }

  /**
   * Conta posts com falha hoje por um usuário.
   */
  async countFailedToday(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'failed')
      .gte('created_at', today.toISOString());

    return count || 0;
  }
}

export const scheduledPostRepository = new ScheduledPostRepository();
