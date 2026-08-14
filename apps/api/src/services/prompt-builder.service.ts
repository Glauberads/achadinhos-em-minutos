import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

export class PromptBuilderService {
  /**
   * Constrói o System Prompt principal do Diretor Criativo
   * injetando todo o conteúdo das Knowledge Bases locais.
   */
  async buildSystemPrompt(platform: string = 'Geral'): Promise<string> {
    try {
      const marketingPrinciples = await this.readKbFile('marketing-principles.md');
      const consumerPsych = await this.readKbFile('consumer-psychology.md');
      const hooksLibrary = await this.readKbFile('hooks-library.md');
      const offerFrameworks = await this.readKbFile('offer-frameworks.md');

      let prompt = `
Você é o Diretor Criativo Autônomo e Especialista em Neuromarketing da plataforma 'Achadinhos em Minutos'.
Sua missão é gerar Criativos (Vídeos e Imagens) focados exclusivamente em CONVERSÃO e retenção de público, substituindo a intuição humana por frameworks validados.

### REGRAS DE MARKETING OBRIGATÓRIAS (Marketing Knowledge Base):
--- PRINCÍPIOS ---
${marketingPrinciples}

--- PSICOLOGIA DO CONSUMIDOR ---
${consumerPsych}

--- HOOKS ---
${hooksLibrary}

--- OFERTAS ---
${offerFrameworks}
`;
      // No futuro, podemos ler regras específicas da plataforma
      prompt += `\nPlataforma Alvo de Otimização: ${platform}\n`;
      return prompt;
    } catch (error) {
      console.error('Erro ao ler Knowledge Base:', error);
      // Fallback seguro mínimo
      return `Você é um Diretor de Marketing especialista em conversão. Escreva scripts de vídeos de até 30s baseados em AIDA e PAS. Foque em chamar atenção nos 3 primeiros segundos.`;
    }
  }

  /**
   * Constrói o Prompt de Tarefa (User Prompt) que inclui os dados do produto,
   * o schema Zod esperado (como o CreativeDNA V2) e as diretrizes de Safety.
   */
  buildTaskPrompt(productData: any, outputSchemaDescription: string): string {
    return `
### DADOS DO PRODUTO (EXTRAÍDO DO MARKETPLACE)
Título: ${productData.title}
Preço: ${productData.price}
Marketplace: ${productData.marketplace}
Descrição Original: ${productData.description || 'Não disponível'}

### A TAREFA
Baseado nos DADOS DO PRODUTO acima e nas REGRAS DE MARKETING OBRIGATÓRIAS do sistema, 
construa a Estratégia do Criativo e o Roteiro Final.

### REGRAS DE SAFETY (Compliance)
1. Não invente benefícios que o produto não possui.
2. Não utilize garantias irreais ou promessas enganosas.
3. Não utilize "Urgência Falsa" (ex: "Faltam 2 minutos!"). Use "Promoção sujeita à virada de lote".
4. Evite jargões publicitários clichês ("Compre agora mesmo e mude de vida"). Seja conversacional.

### SAÍDA ESPERADA
A sua resposta DEVE ser estritamente no formato JSON, respeitando a seguinte estrutura Zod:
${outputSchemaDescription}

Emita APENAS o JSON válido, sem formatações markdown extras (sem \`\`\`json).
`;
  }

  private async readKbFile(filename: string): Promise<string> {
    const kbPath = path.resolve(process.cwd(), '..', '..', 'docs', 'marketing', filename);
    // Como a API roda a partir de apps/api, o caminho absoluto para docs/marketing na raiz do repo
    // depende do start directory. Usaremos o __dirname para resolver de forma mais segura:
    const safeKbPath = path.join(__dirname, '..', '..', '..', '..', 'docs', 'marketing', filename);
    
    try {
      return await fs.readFile(safeKbPath, 'utf8');
    } catch (e) {
      // Fallback caso o caminho mude no Docker
      console.warn(`Aviso: Arquivo KB não encontrado em ${safeKbPath}`);
      return `(Sem diretrizes específicas de ${filename})`;
    }
  }
}

export const promptBuilderService = new PromptBuilderService();
