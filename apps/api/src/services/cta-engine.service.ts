import { MarketingStrategy } from './marketing-brain.service';
import { IntelligenceAnalysis } from './creative-intelligence.service';
import { featureFlagService } from './feature-flag.service';

interface CTATemplate {
  text: string;
  tags: string[];
}

export class CTAEngineService {
  private readonly library: CTATemplate[] = [
    { text: "Confira agora", tags: ['Curiosidade', 'Descoberta'] },
    { text: "Garanta o seu", tags: ['Medo de perder', 'Urgência'] },
    { text: "Últimas unidades", tags: ['Escassez', 'Urgência'] },
    { text: "Clique no link", tags: ['Geral', 'Ação direta'] },
    { text: "Veja o desconto", tags: ['Economia'] },
    { text: "Comprar agora", tags: ['Autoridade', 'Geral'] },
    { text: "Frete grátis", tags: ['Economia', 'Praticidade'] },
    { text: "Oferta limitada", tags: ['Escassez'] }
  ];

  async determineV2CTAStrategy(platform: string, temperature: string): Promise<string> {
    if (platform === 'TikTok') return 'Curto, direto ao link na bio ou carrinho amarelo';
    if (platform === 'Instagram Reels') return 'Comente EU QUERO para automação de DM';
    if (temperature === 'hot') return 'Agressivo com Urgência (Ex: Últimas unidades no link)';
    return 'Geral focado em Benefício + Ação Direta';
  }

  async generateCTA(analysis: IntelligenceAnalysis, strategy: MarketingStrategy): Promise<string> {
    const isV2 = await featureFlagService.isEnabled('creative_intelligence_v2');
    if (isV2) {
      return await this.determineV2CTAStrategy('TikTok', 'warm');
    }

    const matches = this.library.filter(cta => 
      cta.tags.includes(strategy.mental_trigger) || 
      cta.tags.includes(strategy.emotion)
    );

    if (matches.length > 0) {
      const randomIndex = Math.floor(Math.random() * matches.length);
      return matches[randomIndex].text;
    }

    return "Clique aqui";
  }
}

export const ctaEngineService = new CTAEngineService();
