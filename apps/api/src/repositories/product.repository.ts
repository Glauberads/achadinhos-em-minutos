import { supabaseAdmin } from '../lib/supabase';

/**
 * ProductRepository — Centraliza todo acesso a dados da tabela `products`.
 * 
 * Elimina queries Supabase espalhadas pelas rotas e workers.
 * Garante que toda manipulação de produtos passe por um ponto único.
 */
export class ProductRepository {

  /**
   * Busca um produto pelo ID, validando ownership pelo user_id.
   */
  async findById(productId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Verifica se um produto já existe (anti-duplicação).
   * Usa user_id + platform + external_id como chave.
   */
  async findDuplicate(userId: string, platform: string, externalId: string) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('external_id', externalId)
      .single();

    return data;
  }

  /**
   * Insere um produto novo no banco.
   * Força user_id do token (nunca confia no frontend).
   */
  async insert(product: Record<string, any>, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({ ...product, user_id: userId })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Upsert de produto (usado pelo Campaign Runner).
   * Conflito por user_id + platform + external_id.
   */
  async upsert(product: Record<string, any>) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(product, { onConflict: 'user_id, platform, external_id' })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Conta total de produtos de um usuário.
   */
  async countByUser(userId: string): Promise<number> {
    const { count } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return count || 0;
  }
}

// Singleton para reutilização
export const productRepository = new ProductRepository();
