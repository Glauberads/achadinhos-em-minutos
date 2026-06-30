import { aiProvider } from '../providers/ai/ai-factory';

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
  async analyzeProduct(product: any): Promise<IntelligenceAnalysis> {
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
      
      // Defaults to satisfy the interface for fields the AI might miss or we augment later
      return {
        ...parsed,
        recommended_style: parsed.recommended_style || 'Dinâmico',
        recommended_colors: parsed.recommended_colors || ['#FF0000', '#FFFFFF'],
        recommended_fonts: parsed.recommended_fonts || ['Inter', 'Montserrat'],
        recommended_cta: parsed.recommended_cta || 'Compre Agora',
        recommended_hook: parsed.recommended_hook || 'Olha isso!',
        recommended_template: parsed.recommended_template || 'Oferta Relâmpago'
      };
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
