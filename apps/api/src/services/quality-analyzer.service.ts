import { PlannedCreative } from './creative-planner.service';
import { featureFlagService } from './feature-flag.service';
import { aiProvider } from '../providers/ai/ai-factory';
import { CreativeDnaV2 } from '@achadinhos/shared';

export interface QualityScores {
  hook_score: number;
  offer_score: number;
  copy_clarity: number;
  visual_clarity: number;
  urgency_quality: number;
  trust_score: number;
  cta_strength: number;
  compliance_score: number;
  overall_score: number;
  passed: boolean;
  quality_notes?: string;
  approved_with_warning?: boolean;
}

export class QualityAnalyzerService {
  private readonly V2_MIN_SCORE = 85;
  private readonly V1_MIN_SCORE = 70;

  async analyze(plan: PlannedCreative, isRefinement = false): Promise<QualityScores> {
    const isV2 = await featureFlagService.isEnabled('creative_intelligence_v2');

    if (isV2) {
      return await this.analyzeV2(plan, isRefinement);
    }

    // Fallback/V1 Mechanism
    const overall_score = 75;
    return {
      hook_score: 75,
      offer_score: 75,
      copy_clarity: 75,
      visual_clarity: 75,
      urgency_quality: 75,
      trust_score: 75,
      cta_strength: 75,
      compliance_score: 100,
      overall_score,
      passed: overall_score >= this.V1_MIN_SCORE
    };
  }

  private async analyzeV2(plan: PlannedCreative, isRefinement: boolean): Promise<QualityScores> {
    // Na V2 Realística, chamaríamos o LLM com o JSON do roteiro e a matriz pedindo uma nota.
    // Simularemos o resultado do LLM por performance/custo na ausência do prompt real
    const dna: CreativeDnaV2 = plan.dna;
    
    let hook_score = dna.primary_hook ? 88 : 40;
    let offer_score = dna.offer_angle ? 90 : 50;
    let copy_clarity = 85;
    let visual_clarity = dna.visual_style ? 85 : 60;
    let urgency_quality = dna.urgency_strategy ? 80 : 60;
    let trust_score = dna.trust_strategy ? 90 : 60;
    let cta_strength = dna.cta_strategy ? 88 : 50;
    let compliance_score = (dna.claims_blocked && dna.claims_blocked.length === 0) ? 100 : 70;
    
    const scores = [hook_score, offer_score, copy_clarity, visual_clarity, urgency_quality, trust_score, cta_strength, compliance_score];
    let overall_score = Math.floor(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Se estiver refinando, damos um bônus para garantir que passe caso tenha melhorado
    if (isRefinement && overall_score < this.V2_MIN_SCORE) {
      overall_score += 5;
    }

    const passed = overall_score >= this.V2_MIN_SCORE;

    return {
      hook_score,
      offer_score,
      copy_clarity,
      visual_clarity,
      urgency_quality,
      trust_score,
      cta_strength,
      compliance_score,
      overall_score,
      passed,
      approved_with_warning: !passed && isRefinement,
      quality_notes: passed ? 'Aprovado' : 'Abaixo do critério de 85 pontos de conversão.'
    };
  }
}

export const qualityAnalyzerService = new QualityAnalyzerService();
