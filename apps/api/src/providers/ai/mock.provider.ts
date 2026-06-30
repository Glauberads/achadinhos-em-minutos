import { AIProvider } from './ai.provider.interface';

export class MockProvider implements AIProvider {
  async generateContent(prompt: string, options?: { jsonMode?: boolean }): Promise<string> {
    console.log('[MockProvider] Generating content for prompt:', prompt.substring(0, 50) + '...');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (options?.jsonMode) {
      // Return a robust generic mock payload if JSON is expected.
      // This will be parsed by the caller.
      return JSON.stringify({
        mocked: true,
        buyer_persona: {
          demographics: "Mulheres 25-45 anos",
          psychographics: "Buscam praticidade e ofertas"
        },
        pain_points: ["Falta de tempo", "Preços altos"],
        desires: ["Economizar", "Comprar com segurança"],
        emotion: "Urgência",
        urgency_level: "high",
        recommended_style: "Oferta Relâmpago",
        recommended_duration: 15,
        conversion_score: 95,
        marketing_strategy: "Escassez e Desconto",
        confidence: 0.9,
        hook: "VOCÊ NÃO VAI ACREDITAR NESSE PREÇO!",
        cta: "COMPRE AGORA COM DESCONTO",
        colors: ["#FF0000", "#FFFFFF"]
      });
    }

    return "Mocked response text generated successfully.";
  }
}
