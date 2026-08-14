import { MarketingStrategy } from './marketing-brain.service';
import { IntelligenceAnalysis } from './creative-intelligence.service';
import { featureFlagService } from './feature-flag.service';
import * as fs from 'fs/promises';
import * as path from 'path';

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

  async determineV2HookStrategy(awareness: string, temperature: string): Promise<string> {
    // Retorna a estratégia ideal para o PromptBuilder instruir a LLM
    if (awareness === 'unaware' || temperature === 'cold') return 'Curiosity ou Problem-Focused';
    if (awareness === 'problem_aware') return 'Problem-Focused ou Contrarian';
    if (awareness === 'product_aware') return 'Authority ou Lists & Numbers';
    return 'Desired Outcome';
  }

  async generateHook(analysis: IntelligenceAnalysis, strategy: MarketingStrategy): Promise<string> {
    const isV2 = await featureFlagService.isEnabled('creative_intelligence_v2');
    if (isV2) {
      // V2: O Hook não é gerado aqui de forma chumbada, mas retorna a ESTRATÉGIA para o PromptBuilder
      // Na V2 o Planner não usa o generateHook para criar a string final, a LLM cria a string final.
      return await this.determineV2HookStrategy((analysis as any).awareness_level || 'problem_aware', 'cold');
    }

    // V1 Fallback (Listas chumbadas)
    const matches = this.library.filter(hook => 
      hook.tags.includes(strategy.mental_trigger) || 
      hook.tags.includes(strategy.emotion)
    );

    if (matches.length > 0) {
      const randomIndex = Math.floor(Math.random() * matches.length);
      return matches[randomIndex].text;
    }

    return "Olha o que eu acabei de achar!";
  }
}

export const hookEngineService = new HookEngineService();
