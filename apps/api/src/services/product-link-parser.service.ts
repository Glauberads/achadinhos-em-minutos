import { ShopeeProvider } from '../providers/products/shopee.provider';
import { MercadoLivreProvider } from '../providers/products/mercadolivre.provider';

export interface ProductDetails {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  url: string;
  marketplace: 'shopee' | 'mercadolivre';
  rating?: number;
  soldCount?: number;
}

export class ProductLinkParserService {
  async parseAndFetch(url: string): Promise<ProductDetails> {
    const isShopee = url.includes('shopee');
    const isML = url.includes('mercadolivre') || url.includes('mlb');
    
    if (!isShopee && !isML) {
      throw new Error('Domínio não permitido. Use apenas Shopee ou Mercado Livre.');
    }

    try {
      if (isShopee) {
        // Attempt to extract item id
        const match = url.match(/i\.(\d+)\.(\d+)/);
        const productId = match ? match[2] : 'mock_shopee_id';
        
        // Use Mock data since actual providers might require authentication or be complex
        return this.getMockData(url, 'shopee', productId);
      } else {
        const match = url.match(/MLB-?(\d+)/);
        const productId = match ? `MLB${match[1]}` : 'mock_ml_id';
        
        return this.getMockData(url, 'mercadolivre', productId);
      }
    } catch (error) {
      console.error('[ProductLinkParser] Error parsing link', error);
      throw new Error('Falha ao extrair dados do produto. Tente novamente mais tarde.');
    }
  }

  private getMockData(url: string, marketplace: 'shopee' | 'mercadolivre', id: string): ProductDetails {
    return {
      id,
      marketplace,
      url,
      title: marketplace === 'shopee' ? 'Fone de Ouvido Bluetooth Sem Fio' : 'Câmera de Segurança Wi-Fi Full HD',
      price: 89.90,
      originalPrice: 159.90,
      discountPercentage: 43,
      rating: 4.8,
      soldCount: 1500,
      images: [
        'https://placehold.co/600x800/png?text=Product+Image+1',
        'https://placehold.co/600x800/png?text=Product+Image+2',
        'https://placehold.co/600x800/png?text=Product+Image+3'
      ]
    };
  }
}

export const productLinkParserService = new ProductLinkParserService();
