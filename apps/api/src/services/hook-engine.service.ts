import { MarketingStrategy } from './marketing-brain.service';
import { IntelligenceAnalysis } from './creative-intelligence.service';

interface HookTemplate {
  text: string;
  tags: string[];
}

export class HookEngineService {
  private readonly library: HookTemplate[] = [
    { text: "NÃO COMPRE antes de ver isso.", tags: ['Escassez', 'Autoridade', 'Medo de perder'] },
    { text: "Essa oferta acabou de aparecer.", tags: ['Urgência', 'Novidade', 'Busca por praticidade'] },
    { text: "Olha quanto está custando.", tags: ['Economia', 'Curiosidade', 'Busca por praticidade'] },
    { text: "Esse produto está sumindo das prateleiras.", tags: ['Escassez', 'Prova Social', 'Urgência'] },
    { text: "Eu achei isso por menos da metade.", tags: ['Economia', 'Desejo de status'] },
    { text: "O segredo que ninguém te contou.", tags: ['Curiosidade', 'Transformação'] },
    { text: "Se você tem esse problema, pare tudo.", tags: ['Transformação', 'Autoridade', 'Desejo de status'] }
  ];

  generateHook(analysis: IntelligenceAnalysis, strategy: MarketingStrategy): string {
    // Procura hooks que dão match com a estratégia de marketing definida pelo Marketing Brain
    const matches = this.library.filter(hook => 
      hook.tags.includes(strategy.mental_trigger) || 
      hook.tags.includes(strategy.emotion)
    );

    if (matches.length > 0) {
      // Pick a random match for some A/B variety or pick the first
      const randomIndex = Math.floor(Math.random() * matches.length);
      return matches[randomIndex].text;
    }

    // Fallback if no specific match
    return "Olha o que eu acabei de achar!";
  }
}

export const hookEngineService = new HookEngineService();
