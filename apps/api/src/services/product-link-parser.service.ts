import { redisConnection } from '../lib/redis';
import crypto from 'crypto';

export interface ProductDetails {
  id: string;
  marketplace: 'shopee' | 'mercadolivre';
  url: string;
  title: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  soldCount: number;
  images: string[];
  source_image_strategy: string;
  original_image_found: boolean;
}

export class ProductLinkParserService {
  private memoryCache = new Map<string, { data: ProductDetails; expires: number }>();

  private logDebug(message: string, data?: any) {
    if (process.env.DEBUG_PRODUCT_IMAGE_EXTRACTION === 'true') {
      console.log(`[ProductLinkParser] ${message}`, data ? data : '');
    }
  }

  async parseAndFetch(url: string): Promise<ProductDetails> {
    this.logDebug('Starting extraction for URL:', url);
    const marketplace = this.identifyMarketplace(url);
    if (!marketplace) {
      throw new Error('Link de marketplace não suportado. Use Shopee ou Mercado Livre.');
    }
    this.logDebug('Marketplace detected:', marketplace);

    const urlHash = crypto.createHash('sha256').update(url).digest('hex');
    const cacheKey = `product_parser:${urlHash}`;

    // 1. Tenta Memory Cache
    const memHit = this.memoryCache.get(cacheKey);
    if (memHit && memHit.expires > Date.now()) {
      this.logDebug('Memory Cache Hit', cacheKey);
      return { ...memHit.data, cached: true } as ProductDetails & { cached: true };
    }

    // 2. Tenta Redis Cache
    try {
      if (redisConnection.status === 'ready') {
        const redisHit = await redisConnection.get(cacheKey);
        if (redisHit) {
          this.logDebug('Redis Cache Hit', cacheKey);
          const parsed = JSON.parse(redisHit);
          this.memoryCache.set(cacheKey, { data: parsed, expires: Date.now() + 1000 * 60 * 5 }); // 5 min local
          return { ...parsed, cached: true };
        }
      }
    } catch (err) {
      this.logDebug('Redis cache check failed, proceeding to extract', err);
    }

    const id = this.extractId(url, marketplace);
    
    // Tenta puxar os metadados reais
    const realData = await this.tryFetchRealData(url, marketplace, id);
    let finalData = realData;
    
    if (!realData) {
      this.logDebug('Real data extraction failed, using fallback mock data');
      finalData = this.getMockData(url, marketplace, id);
    } else {
      this.logDebug('Real data extracted successfully', { imagesCount: realData.images.length, strategy: realData.source_image_strategy });
    }

    // 3. Salva no Cache
    try {
      const ttl = 60 * 60 * 24; // 24h
      if (redisConnection.status === 'ready') {
        await redisConnection.setex(cacheKey, ttl, JSON.stringify(finalData));
      }
      this.memoryCache.set(cacheKey, { data: finalData as ProductDetails, expires: Date.now() + 1000 * ttl });
    } catch (err) {
      this.logDebug('Failed to save to cache', err);
    }

    return finalData as ProductDetails;
  }

  private identifyMarketplace(url: string): 'shopee' | 'mercadolivre' | null {
    if (url.includes('shopee.com.br') || url.includes('shp.ee')) return 'shopee';
    if (url.includes('mercadolivre.com.br') || url.includes('mlb.com.br')) return 'mercadolivre';
    return null;
  }

  private extractId(url: string, marketplace: 'shopee' | 'mercadolivre'): string {
    if (marketplace === 'shopee') {
      const match = url.match(/i\.(\d+)\.(\d+)/);
      return match ? `${match[1]}_${match[2]}` : `shp_${Date.now()}`;
    } else {
      const match = url.match(/MLB-?(\d+)/i);
      return match ? `MLB${match[1]}` : `mlb_${Date.now()}`;
    }
  }

  private normalizeImageUrl(imageUrl: string, baseUrl: string): string | null {
    if (!imageUrl) return null;
    let url = imageUrl.trim();
    
    // Reject invalid schemes
    if (url.startsWith('data:') || url.startsWith('base64')) {
      return null;
    }

    // Handle relative URLs
    if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (url.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        url = `${base.origin}${url}`;
      } catch (e) {
        return null;
      }
    }

    // Must be http or https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return null;
    }

    return url;
  }

  private getMockData(url: string, marketplace: 'shopee' | 'mercadolivre', id: string): ProductDetails {
    // Tenta inferir o título a partir da URL caso o scraping falhe
    let inferredTitle = marketplace === 'shopee' ? 'Produto Shopee' : 'Produto Mercado Livre';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      const possibleNamePart = pathParts[0]; 
      if (possibleNamePart && possibleNamePart.length > 5) {
        // Limpa a string da URL (remove -i.123.123 ou -MLB123 e troca hifens por espaços)
        let cleaned = possibleNamePart.replace(/-i\.\d+\.\d+$/, '').replace(/-MLB\d+$/, '').replace(/-/g, ' ');
        try {
          cleaned = decodeURIComponent(cleaned);
        } catch (e) {}
        
        if (cleaned) {
          inferredTitle = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
      }
    } catch (e) {}

    const firstWord = inferredTitle.split(' ')[0].toLowerCase() || 'product';
    const defaultImage = `https://loremflickr.com/600/800/${encodeURIComponent(firstWord)}?lock=${Math.floor(Math.random() * 1000)}`;
    return {
      id,
      marketplace,
      url,
      title: inferredTitle,
      price: 89.90,
      originalPrice: 159.90,
      discountPercentage: 43,
      rating: 4.8,
      soldCount: 1500,
      images: [defaultImage],
      source_image_strategy: 'fallback',
      original_image_found: false
    };
  }

  private async tryFetchRealData(url: string, marketplace: 'shopee' | 'mercadolivre', id: string): Promise<ProductDetails | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      clearTimeout(timeoutId);
      const html = await response.text();
      
      const extracted = this.extractProductMetadataFromUrl(html, url, marketplace);
      if (extracted.title || extracted.images.length > 0) {
        return {
          id,
          marketplace,
          url,
          title: extracted.title || (marketplace === 'shopee' ? 'Produto Shopee' : 'Produto Mercado Livre'),
          price: extracted.price || 89.90,
          originalPrice: (extracted.price || 89.90) * 1.5,
          discountPercentage: 33,
          rating: 4.8,
          soldCount: 1500,
          images: extracted.images.length > 0 ? extracted.images : [this.getMockData(url, marketplace, id).images[0]],
          source_image_strategy: extracted.images.length > 0 ? extracted.strategy : 'fallback',
          original_image_found: extracted.images.length > 0 ? extracted.original_image_found : false
        };
      }
      return null;
    } catch (err) {
      this.logDebug('Scraping error', err);
      return null;
    }
  }

  private extractProductMetadataFromUrl(html: string, baseUrl: string, marketplace: string) {
    let title: string | null = null;
    let images: string[] = [];
    let strategy = 'fallback';
    let price: number | null = null;

    // 1. Título
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (titleMatch) {
      title = titleMatch[1].replace(' | Shopee Brasil', '').replace(' | MercadoLivre', '').trim();
    }

    // 2. Preço
    const priceMatch = html.match(/<meta property="product:price:amount" content="([^"]+)"/i) || html.match(/"price":\s*([\d.]+)/i);
    if (priceMatch && !isNaN(parseFloat(priceMatch[1]))) {
      price = parseFloat(priceMatch[1]);
    }

    // Helpers to add image safely
    const tryAddImage = (imgUrl: string | null, stratName: string): boolean => {
      if (!imgUrl) return false;
      const normalized = this.normalizeImageUrl(imgUrl, baseUrl);
      if (normalized && !images.includes(normalized)) {
        images.push(normalized);
        if (strategy === 'fallback') strategy = stratName;
        return true;
      }
      return false;
    };

    // 3. Extratores de Imagem (Ordem de Prioridade)
    
    // a) Provider Específico (Mercado Livre json)
    if (marketplace === 'mercadolivre') {
      // Buscar picture arrays ou schemas ML
      const mlPicsMatch = html.match(/"pictures":\[(.*?)\]/);
      if (mlPicsMatch) {
        const picUrls = mlPicsMatch[1].match(/"(?:secure_url|url)":"(https?:\/\/[^"]+)"/g);
        if (picUrls) {
          let found = false;
          for (const matchStr of picUrls) {
            const urlMatch = matchStr.match(/"(?:secure_url|url)":"([^"]+)"/);
            if (urlMatch && tryAddImage(urlMatch[1], 'provider')) {
              found = true;
            }
          }
          if (found) this.logDebug('Images extracted via MercadoLivre provider schema');
        }
      }
    }

    // b) OG:Image
    if (images.length === 0) {
      const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
      if (ogMatch) {
        tryAddImage(ogMatch[1], 'og_image');
        this.logDebug('Images extracted via og:image', ogMatch[1]);
      }
    }

    // c) Twitter:Image
    if (images.length === 0) {
      const twitterMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i) || html.match(/<meta\s+content="([^"]+)"\s+name="twitter:image"/i);
      if (twitterMatch) {
        tryAddImage(twitterMatch[1], 'twitter_image');
        this.logDebug('Images extracted via twitter:image', twitterMatch[1]);
      }
    }

    // d) JSON-LD
    if (images.length === 0) {
      const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
      if (ldMatches) {
        for (const script of ldMatches) {
          const imgMatch = script.match(/"image":\s*(?:\[\s*)?"([^"]+)"/i);
          if (imgMatch) {
            if (tryAddImage(imgMatch[1], 'json_ld')) {
              this.logDebug('Images extracted via JSON-LD', imgMatch[1]);
              break;
            }
          }
        }
      }
    }

    // e) Primeira imagem genérica no HTML
    if (images.length === 0) {
      const imgMatches = html.match(/<img[^>]+src="([^"]+)"/ig);
      if (imgMatches) {
        for (const imgTag of imgMatches) {
          const srcMatch = imgTag.match(/src="([^"]+)"/i);
          if (srcMatch && !srcMatch[1].includes('data:') && srcMatch[1].length > 10) {
            if (tryAddImage(srcMatch[1], 'html_image')) {
              this.logDebug('Images extracted via HTML fallback', srcMatch[1]);
              break;
            }
          }
        }
      }
    }

    return { title, images, strategy, price, original_image_found: true };
  }
}

export const productLinkParserService = new ProductLinkParserService();
