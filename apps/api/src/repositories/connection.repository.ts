import { supabaseAdmin } from '../lib/supabase';

/**
 * ConnectionRepository — Centraliza acesso à tabela `platform_connections`.
 * 
 * Tabela protegida: apenas o backend (Service Role) tem acesso.
 * O frontend NUNCA acessa esta tabela diretamente.
 */
export class ConnectionRepository {

  /**
   * Busca conexão de uma plataforma específica para um usuário.
   */
  async findByPlatform(userId: string, platform: string) {
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    return { data, error };
  }

  /**
   * Busca conexão ativa de uma plataforma.
   */
  async findConnectedByPlatform(userId: string, platform: string) {
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('status', 'connected')
      .single();

    return { data, error };
  }

  /**
   * Lista todas as conexões de um usuário (sem expor access_token).
   */
  async findAllByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('platform_connections')
      .select('platform, status, metadata, updated_at')
      .eq('user_id', userId);

    return { data: data || [], error };
  }

  /**
   * Upsert: cria ou atualiza uma conexão.
   */
  async upsert(userId: string, platform: string, fields: Record<string, any>) {
    const { data: existing } = await this.findByPlatform(userId, platform);

    if (existing) {
      const { error } = await supabaseAdmin
        .from('platform_connections')
        .update({
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return { isNew: false, error };
    } else {
      const { error } = await supabaseAdmin
        .from('platform_connections')
        .insert({
          user_id: userId,
          platform,
          ...fields,
        });

      return { isNew: true, error };
    }
  }
}

export const connectionRepository = new ConnectionRepository();
