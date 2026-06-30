import { eventBus, CreativeFailedEvent } from '../events';
import { ProductDetails } from './product-link-parser.service';

export interface AICreativeOutput {
  title: string;
  headline: string;
  caption: string;
  cta: string;
  shortCopy: string;
  longCopy: string;
  hashtags: string[];
  script: Array<{
    scene: number;
    duration: number;
    headline: string;
    subtitle: string;
    visual: string;
    cta: string | null;
  }>;
}

export class CreativeAIService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  async generateCreative(product: ProductDetails, style: string): Promise<AICreativeOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    const isMockEnabled = process.env.CREATIVE_AI_MOCK_ENABLED === 'true';
    const provider = process.env.CREATIVE_AI_PROVIDER || 'gemini';

    if (!apiKey || isMockEnabled || provider !== 'gemini') {
      console.log('[CreativeAIService] Using Mock Provider');
      return this.getMockCreative(product, style);
    }

    try {
      const prompt = this.buildPrompt(product, style);
      
      const response = await fetch(`${this.GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error('Empty response from Gemini');
      
      return JSON.parse(rawText) as AICreativeOutput;
      
    } catch (error) {
      console.error('[CreativeAIService] AI Generation Failed, falling back to mock:', error);
      // Emit event for Audit Log
      eventBus.emit(new CreativeFailedEvent({ creative_id: 'system', error_message: `Gemini Fallback Triggered: ${(error as Error).message}` }, { source: 'CreativeAIService' }));
      
      return this.getMockCreative(product, style);
    }
  }

  private buildPrompt(product: ProductDetails, style: string): string {
    return `
      Você é um especialista em Copywriting e Marketing de Afiliados.
      Crie uma campanha de venda para o seguinte produto:
      
      Produto: ${product.title}
      Preço: R$ ${product.price}
      Desconto: ${product.discountPercentage}%
      Estilo de Vídeo Desejado: ${style}
      
      O objetivo é gerar alta conversão no TikTok e Instagram Reels.
      
      Retorne APENAS um JSON válido com a seguinte estrutura exata, sem blocos de markdown:
      {
        "title": "título curto (max 30 chars)",
        "headline": "gancho para o início do vídeo",
        "caption": "legenda persuasiva para o post",
        "cta": "chamada para ação (ex: Comente QUERO)",
        "shortCopy": "texto curto direto ao ponto",
        "longCopy": "texto longo com dor, solução e oferta",
        "hashtags": ["#achadinho", "#shopee"],
        "script": [
          {
            "scene": 1,
            "duration": 2,
            "headline": "texto principal na tela",
            "subtitle": "texto menor",
            "visual": "product_zoom ou product_pan ou text_only",
            "cta": null
          }
        ] // deve ter exatamente de 5 a 7 cenas, totalizando 10 a 15 segundos
      }
    `;
  }

  private getMockCreative(product: ProductDetails, style: string): AICreativeOutput {
    const isUrgent = style === 'Urgência Máxima' || style === 'Oferta Relâmpago';
    return {
      title: 'Achadinho Incrível',
      headline: isUrgent ? 'CUIDADO: Vai Esgotar Rápido!' : 'Olha o que eu encontrei...',
      caption: `${isUrgent ? '🚨 CORRE!' : '✨ Um achado especial para você!'} ${product.title} por apenas R$ ${product.price}. Comente QUERO que te mando o link!`,
      cta: 'Comente QUERO',
      shortCopy: `Apenas R$ ${product.price} com ${product.discountPercentage}% de desconto!`,
      longCopy: `Se você estava procurando por ${product.title}, essa é a sua chance. O preço despencou de R$ ${product.originalPrice} para R$ ${product.price}. Corre antes que acabe!`,
      hashtags: ['#achadinhos', '#oferta', '#desconto'],
      script: [
        { scene: 1, duration: 2, headline: isUrgent ? '🚨 URGENTE!' : '✨ ACHADINHO', subtitle: 'Olha o que descobri', visual: 'product_zoom', cta: null },
        { scene: 2, duration: 2, headline: product.title, subtitle: 'O mais desejado', visual: 'product_pan', cta: null },
        { scene: 3, duration: 3, headline: `De R$ ${product.originalPrice}`, subtitle: `Por apenas R$ ${product.price}`, visual: 'product_zoom', cta: null },
        { scene: 4, duration: 2, headline: `${product.discountPercentage}% OFF`, subtitle: 'Promoção exclusiva', visual: 'product_pan', cta: null },
        { scene: 5, duration: 3, headline: 'Quer o link?', subtitle: 'Comente "QUERO" abaixo!', visual: 'text_only', cta: 'COMENTE QUERO' }
      ]
    };
  }
}

export const creativeAIService = new CreativeAIService();
