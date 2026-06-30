import { MarketingStrategy } from './marketing-brain.service';
import { IntelligenceAnalysis } from './creative-intelligence.service';

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

  generateCTA(analysis: IntelligenceAnalysis, strategy: MarketingStrategy): string {
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
