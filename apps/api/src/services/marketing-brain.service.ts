export interface MarketingStrategy {
  emotion: string;
  mental_trigger: string;
  language: string;
  video_type: string;
  duration_seconds: number;
  main_promise: string;
  objection_to_break: string;
}

export class MarketingBrainService {
  private readonly triggers = [
    'Escassez', 'Urgência', 'Prova Social', 'Curiosidade', 
    'Exclusividade', 'Novidade', 'Transformação', 'Economia', 'Autoridade'
  ];

  private readonly emotions = [
    'Medo de perder', 'Desejo de status', 'Busca por praticidade', 'Amor próprio/Beleza'
  ];

  async determineStrategy(product: any, intelligenceAnalysis: any): Promise<MarketingStrategy> {
    // In a full implementation, this could use the AIProvider to ask the LLM 
    // to map the product to the best predefined trigger.
    // For now, we apply heuristic rules based on intelligenceAnalysis.
    
    let trigger = 'Economia';
    let emotion = 'Busca por praticidade';

    if (intelligenceAnalysis.urgency_level === 'high') {
      trigger = 'Urgência';
      emotion = 'Medo de perder';
    } else if (product.category === 'Moda' || product.category === 'Beleza') {
      trigger = 'Transformação';
      emotion = 'Desejo de status';
    } else if (product.price > 200) {
      trigger = 'Autoridade';
    }

    return {
      emotion,
      mental_trigger: trigger,
      language: 'Persuasiva, direta e focada em benefícios',
      video_type: 'Short form (TikTok/Reels)',
      duration_seconds: intelligenceAnalysis.recommended_duration || 15,
      main_promise: `Resolva ${intelligenceAnalysis.pain_points?.[0] || 'seu problema'} agora`,
      objection_to_break: intelligenceAnalysis.objections?.[0] || 'Está caro'
    };
  }
}

export const marketingBrainService = new MarketingBrainService();
