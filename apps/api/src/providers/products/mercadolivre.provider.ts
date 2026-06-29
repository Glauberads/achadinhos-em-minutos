import { IProductProvider, NormalizedProduct, SearchFilters } from './product-provider.types';
import { supabaseAdmin } from '../../lib/supabase';
import { decryptSecret } from '../../lib/crypto';
import { cacheService } from '../../services/cache.service';
import { CacheKeys } from '../../cache/cache-keys';

export class MercadoLivreProvider implements IProductProvider {
  
  async search(filters: SearchFilters, userId?: string): Promise<NormalizedProduct[]> {
    let clientId = null;
    let clientSecret = null;

    if (userId) {
      try {
        const { data: conn } = await supabaseAdmin
          .from('platform_connections')
          .select('metadata')
          .eq('user_id', userId)
          .eq('platform', 'mercadolivre')
          .eq('status', 'connected')
          .single();

        if (conn && conn.metadata?.app_id && conn.metadata?.app_secret) {
          clientId = conn.metadata.app_id;
          clientSecret = decryptSecret(conn.metadata.app_secret);
        }
      } catch (error) {
        console.error('[ML Provider] Erro ao carregar credenciais:', error);
      }
    }

    try {
      const query = filters.keyword ? encodeURIComponent(filters.keyword) : 'ofertas';
      const limit = filters.limit || 10;
      const url = `https://api.mercadolibre.com/sites/MLB/search?q=${query}&sort=relevance&limit=${limit}`;

      // Chave padronizada (Ex: marketplace:mercadolivre:search:1234:8c8d8f9)
      const cacheKey = CacheKeys.marketplace.search('mercadolivre', userId || 'anonymous', filters);

      // Usar remember (15 minutos de TTL)
      return await cacheService.remember(cacheKey, 900, async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar no Mercado Livre');
        
        const data: any = await response.json();
        return data.results.map((item: any) => this.normalize(item, clientId));
      });

    } catch (error) {
      console.error('Erro no ML Provider:', error);
      return [];
    }
  }

  private normalize(item: any, clientId: string | null): NormalizedProduct {
    const originalPrice = item.original_price || null;
    const currentPrice = item.price;
    
    let discount = null;
    if (originalPrice && originalPrice > currentPrice) {
      discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    const freeShipping = item.shipping?.free_shipping || false;
    
    // ML não retorna vendas exatas no search, tentamos extrair sinais
    // Usamos available_quantity ou criamos um score baseado na condição e envio
    let soldCount = null;
    let scoreReason = 'Baseado na relevância geral do ML';

    if (item.sold_quantity) {
       soldCount = item.sold_quantity; // Pode não vir mais nas APIS novas
       scoreReason = `Sinal de venda: ${soldCount} itens`;
    }

    return {
      platform: 'mercadolivre',
      external_id: item.id,
      title: item.title,
      original_price: originalPrice,
      current_price: currentPrice,
      discount: discount,
      image_url: item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg') : null, // O pega imagem original se possível
      source_url: item.permalink,
      affiliate_link: null, // Meli API publica não dá afiliado direto
      rating: null, // Search do ML não traz rating diretamente
      sold_count: soldCount,
      category: item.category_id,
      free_shipping: freeShipping,
      metadata: {
        score_reason: scoreReason,
        affiliate_status: 'missing',
        condition: item.condition
      }
    };
  }
}
