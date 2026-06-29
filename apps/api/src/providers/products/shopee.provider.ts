import { IProductProvider, NormalizedProduct, SearchFilters } from './product-provider.types';
import { supabaseAdmin } from '../../lib/supabase';
import { decryptSecret } from '../../lib/crypto';
import { cacheService } from '../../services/cache.service';
import { CacheKeys } from '../../cache/cache-keys';

export class ShopeeProvider implements IProductProvider {
  async search(filters: SearchFilters, userId?: string): Promise<NormalizedProduct[]> {
    if (!userId) return this.mockFallback(filters);

    const cacheKey = CacheKeys.marketplace.search('shopee', userId || 'anonymous', filters);

    return await cacheService.remember(cacheKey, 900, async () => {
      try {
        const { data: conn } = await supabaseAdmin
          .from('platform_connections')
          .select('metadata')
          .eq('user_id', userId!)
          .eq('platform', 'shopee')
          .eq('status', 'connected')
          .single();

        if (conn && conn.metadata?.app_id && conn.metadata?.app_secret) {
          const appId = conn.metadata.app_id;
          // const appSecret = decryptSecret(conn.metadata.app_secret);
          const affiliateId = conn.metadata.affiliate_id;
          
          console.log(`[Shopee] Simulando busca real para o App ID: ${appId}`);
          return this.mockFallback(filters, affiliateId);
        }
      } catch (error) {
        console.error('[Shopee Provider] Erro ao carregar credenciais:', error);
      }

      return this.mockFallback(filters);
    });
  }

  private async mockFallback(filters: SearchFilters, affiliateId?: string): Promise<NormalizedProduct[]> {
    // Simulando delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    const keyword = filters.keyword || 'Produto';
    
    // Gerando 5 produtos mockados
    return Array.from({ length: 5 }).map((_, index) => {
      const original = 100 + (Math.random() * 200);
      const discount = Math.floor(Math.random() * 40) + 10; // 10% a 50%
      const current = original * (1 - (discount / 100));
      const sold = Math.floor(Math.random() * 5000) + 100;
      const freeShipping = Math.random() > 0.5;
      
      return {
        platform: 'shopee',
        external_id: `shp_mock_${Date.now()}_${index}`,
        title: `${keyword} ${index + 1} - Excelente Qualidade (MOCK)`,
        original_price: Number(original.toFixed(2)),
        current_price: Number(current.toFixed(2)),
        discount: discount,
        image_url: 'https://cf.shopee.com.br/file/b4a4fa8a892f3f98285bd5e27a6f20cc', // Placeholder genérico
        source_url: `https://shopee.com.br/product-mock-${index}`,
        affiliate_link: null, // Sem link de afiliado no mock
        rating: 4.5 + (Math.random() * 0.5),
        sold_count: sold,
        category: filters.category || 'Geral',
        free_shipping: freeShipping,
        metadata: {
          is_mock: true,
          score_reason: 'Mock baseado em volume de vendas alto',
          affiliate_status: 'missing'
        }
      };
    });
  }
}
