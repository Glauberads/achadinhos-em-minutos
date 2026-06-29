import { supabaseAdmin } from '../lib/supabase';

/**
 * GroupRepository — Centraliza acesso à tabela `groups`.
 */
export class GroupRepository {

  /**
   * Busca grupo por ID validando ownership.
   */
  async findById(groupId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    return { data, error };
  }

  /**
   * Lista grupos ativos de um usuário.
   */
  async findActiveByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  }

  /**
   * Insere novo grupo.
   */
  async create(data: Record<string, any>) {
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .insert(data)
      .select()
      .single();

    return { data: group, error };
  }

  /**
   * Conta grupos ativos de um usuário.
   */
  async countActiveByUser(userId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    return count || 0;
  }
}

export const groupRepository = new GroupRepository();
