import { productLinkParserService } from './product-link-parser.service';
import { creativeRepository } from '../repositories/creative.repository';
import { eventBus, CreativeSavedEvent } from '../events';

export class ImageCreativeService {
  async generateFromLink(url: string, format: string, style: string, userId: string) {
    // 1. Extract Product Data
    const product = await productLinkParserService.parseAndFetch(url);

    // 2. Generate Copy (Heuristics based on style for MVP)
    let headline = product.title.substring(0, 40) + '...';
    let cta = 'Compre Agora!';
    let badge = 'Desconto';
    let themeColor = '#f97316'; // orange-500

    switch (style) {
      case 'Oferta Relâmpago':
        headline = '🔥 OFERTA RELÂMPAGO';
        cta = 'Aproveite Hoje!';
        badge = '70% OFF';
        themeColor = '#ef4444'; // red-500
        break;
      case 'Achadinho Viral':
        headline = 'ACHEI NA SHOPEE 😱';
        cta = 'Link na Bio';
        badge = 'Viral';
        themeColor = '#a855f7'; // purple-500
        break;
      case 'Premium Minimalista':
        headline = 'Must Have';
        cta = 'Discover';
        badge = 'Premium';
        themeColor = '#171717'; // neutral-900
        break;
      case 'Alerta de Estoque':
        headline = 'ÚLTIMAS UNIDADES 🚨';
        cta = 'Garanta o seu';
        badge = 'Estoque Baixo';
        themeColor = '#eab308'; // yellow-500
        break;
      case 'Super Desconto':
        headline = 'PREÇO IMPERDÍVEL 💰';
        cta = 'Ver Oferta';
        badge = 'Super Sale';
        themeColor = '#22c55e'; // green-500
        break;
    }

    const design_payload = {
      headline,
      cta,
      badge,
      style,
      format,
      themeColor,
      price: product.price,
      discount: product.discountPercentage,
      image_url: product.images?.[0] || 'https://placehold.co/600x800'
    };

    // 3. Save Draft (marked as ready so frontend can render it immediately)
    const creative = await creativeRepository.create({
      user_id: userId,
      marketplace: product.marketplace,
      product_url: product.url,
      title: product.title,
      description: `Imagem para ${format} - ${style}`,
      image_urls: product.images || [],
      thumbnail_url: product.images?.[0] || 'https://placehold.co/600x800',
      status: 'draft',
      generation_status: 'ready', 
      metadata: {
        creative_type: 'image',
        image_format: format,
        external_product_id: product.id,
        product_image_url: product.images?.[0] || 'https://placehold.co/600x800',
        source_image_strategy: product.source_image_strategy || 'fallback',
        original_image_found: product.original_image_found ?? false,
        design_payload
      }
    });

    // 4. Emit Event correctly
    eventBus.emit(new CreativeSavedEvent({ creative_id: creative.id }, { user_id: userId, source: 'ImageCreativeService' }));

    return creative;
  }
}

export const imageCreativeService = new ImageCreativeService();
