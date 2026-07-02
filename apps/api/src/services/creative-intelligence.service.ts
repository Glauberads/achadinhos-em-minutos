import { aiProvider } from '../providers/ai/ai-factory';
import { redisConnection } from '../lib/redis';
import crypto from 'crypto';
import { CreativeIntelligenceInputDTO, CreativeIntelligenceOutputDTO, creativeIntelligenceSchema, creativeIntelligenceOutputSchema } from '../validators/creative-os.validator';
import { featureFlagService } from './feature-flag.service';
import { telemetryService } from './telemetry.service';

export interface IntelligenceAnalysis {
  buyer_persona: any;
  pain_points: string[];
  desires: string[];
  benefits: string[];
  objections: string[];
  emotion: string;
  urgency_level: 'high' | 'medium' | 'low';
  recommended_style: string;
  recommended_duration: number;
  recommended_colors: string[];
  recommended_fonts: string[];
  recommended_cta: string;
  recommended_hook: string;
  recommended_template: string;
  conversion_score: number;
  confidence: number;
}

export class CreativeIntelligenceService {
  private memoryCache = new Map<string, { data: IntelligenceAnalysis; expires: number }>();

  /**
   * [NOVO FLUXO - CREATIVE OS]
   * Analisa dados criativos da plataforma e público.
   * [EXPERIMENTAL] - Protegido pela flag 'creative_os'.
   */
  async analyzeForCreativeOS(input: CreativeIntelligenceInputDTO): Promise<CreativeIntelligenceOutputDTO> {
    const isCreativeOsEnabled = await featureFlagService.isEnabled('creative_os');
    const parsedInput = creativeIntelligenceSchema.parse(input);

    if (!isCreativeOsEnabled) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'FALLBACK', total_time_ms: 0, metadata: { action: 'skipped', platform: parsedInput.platform } });
      return this.getFallbackCreativeOSAnalysis();
    }

    try {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 0, metadata: { action: 'started', platform: parsedInput.platform } });

      // MOCK IMPLEMENTATION (Block 2)
      let bestPractices: string[] = [];
      let bannedWords: string[] = ['comprar', 'promoção'];

      if (parsedInput.platform === 'tiktok') {
        bestPractices = ['Uso de músicas virais em background', 'Cortes rápidos nos primeiros 3 segundos', 'Legendas dinâmicas'];
        bannedWords.push('link na bio', 'compre agora');
      } else if (parsedInput.platform === 'reels') {
        bestPractices = ['Alta qualidade visual', 'Estilo lifestyle', 'Uso de stickers nativos'];
        bannedWords.push('tiktok');
      } else {
        bestPractices = ['Mensagem direta e reta', 'Loop infinito perfeito'];
      }

      const mockResult: CreativeIntelligenceOutputDTO = {
        bestPractices,
        bannedWords
      };

      const validatedOutput = creativeIntelligenceOutputSchema.parse(mockResult);

      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'SUCCESS', total_time_ms: 500, metadata: { 
        action: 'success',
        platform: parsedInput.platform,
        mode: 'mock'
      }});

      return validatedOutput;
    } catch (error: any) {
      telemetryService.log({ operation_type: 'AI_GENERATION', status: 'ERROR', total_time_ms: 0, error_message: error.message, metadata: {
        platform: parsedInput.platform
      }});
      return this.getFallbackCreativeOSAnalysis();
    }
  }

  private getFallbackCreativeOSAnalysis(): CreativeIntelligenceOutputDTO {
    return {
      bestPractices: ['Cortes rápidos', 'Alta energia'],
      bannedWords: []
    };
  }

  async analyzeProduct(product: any): Promise<IntelligenceAnalysis> {
    const productHash = crypto.createHash('sha256').update(product.id || product.url).digest('hex');
    const style = product.style || 'default';
    const cacheKey = `creative_intelligence:${productHash}:${style}`;

    // 1. Memory Cache
    const memHit = this.memoryCache.get(cacheKey);
    if (memHit && memHit.expires > Date.now()) {
      return { ...memHit.data, cached: true } as IntelligenceAnalysis & { cached: true };
    }

    // 2. Redis Cache
    try {
      if (redisConnection.status === 'ready') {
        const redisHit = await redisConnection.get(cacheKey);
        if (redisHit) {
          const parsed = JSON.parse(redisHit);
          this.memoryCache.set(cacheKey, { data: parsed, expires: Date.now() + 1000 * 60 * 5 });
          return { ...parsed, cached: true };
        }
      }
    } catch (err) {
      console.warn('Redis read failed for intelligence cache', err);
    }

    const prompt = `
      Você é um especialista em marketing direto, copywriting e neuromarketing.
      Analise o seguinte produto e defina a persona compradora, suas dores, desejos, benefícios chave e objeções.
      Produto: ${product.title}
      Descrição: ${product.description || ''}
      Preço: ${product.price} (Desconto: ${product.discount || 'Nenhum'})
      Categoria: ${product.category || 'Geral'}
      Avaliações: ${product.rating || 'N/A'}
      
      Gere a saída OBRIGATORIAMENTE em formato JSON com as seguintes chaves:
      - buyer_persona (objeto com age, gender, psychographics)
      - pain_points (array de strings)
      - desires (array de strings)
      - benefits (array de strings)
      - objections (array de strings)
      - emotion (string)
      - urgency_level ('high', 'medium', 'low')
      - recommended_duration (numero, ex: 15)
      - conversion_score (numero de 0 a 100 estimando a chance de conversão caso abordemos a dor principal)
      - confidence (numero de 0 a 1 indicando sua confiança na análise)
    `;

    try {
      const responseText = await aiProvider.generateContent(prompt, { jsonMode: true });
      const parsed = JSON.parse(responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, ''));
      
      
      const analysisData = {
        ...parsed,
        recommended_style: parsed.recommended_style || 'Dinâmico',
        recommended_colors: parsed.recommended_colors || ['#FF0000', '#FFFFFF'],
        recommended_fonts: parsed.recommended_fonts || ['Inter', 'Montserrat'],
        recommended_cta: parsed.recommended_cta || 'Compre Agora',
        recommended_hook: parsed.recommended_hook || 'Olha isso!',
        recommended_template: parsed.recommended_template || 'Oferta Relâmpago'
      };

      // 3. Salvar Cache
      try {
        const ttl = 60 * 60 * 6; // 6h
        if (redisConnection.status === 'ready') {
          await redisConnection.setex(cacheKey, ttl, JSON.stringify(analysisData));
        }
        this.memoryCache.set(cacheKey, { data: analysisData, expires: Date.now() + 1000 * ttl });
      } catch (err) {
        console.warn('Failed to save intelligence to cache', err);
      }

      return analysisData;
    } catch (error) {
      console.error('Creative Intelligence fallback used due to error:', error);
      return this.getFallbackAnalysis(product);
    }
  }

  private getFallbackAnalysis(product: any): IntelligenceAnalysis {
    return {
      buyer_persona: { age: '25-45', gender: 'Todos', psychographics: 'Buscam economia' },
      pain_points: ['Preços altos'],
      desires: ['Economizar muito'],
      benefits: ['Preço reduzido', 'Fácil de usar'],
      objections: ['Pode ser golpe', 'Frete caro'],
      emotion: 'Urgência',
      urgency_level: 'high',
      recommended_style: 'Oferta Relâmpago',
      recommended_duration: 15,
      recommended_colors: ['#FF0000', '#FFFFFF'],
      recommended_fonts: ['Inter', 'Montserrat'],
      recommended_cta: 'Compre Agora',
      recommended_hook: 'Você não vai acreditar nesse preço!',
      recommended_template: 'Oferta Relâmpago',
      conversion_score: 85,
      confidence: 0.7
    };
  }
}

export const creativeIntelligenceService = new CreativeIntelligenceService();
