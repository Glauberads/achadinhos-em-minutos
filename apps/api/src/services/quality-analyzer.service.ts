import { PlannedCreative } from './creative-planner.service';

export interface QualityScores {
  hook_score: number;
  copy_score: number;
  cta_score: number;
  visual_score: number;
  motion_score: number;
  readability_score: number;
  trust_score: number;
  viral_score: number;
  overall_score: number;
  passed: boolean;
}

export class QualityAnalyzerService {
  private readonly MIN_SCORE_THRESHOLD = 70;

  async analyze(plan: PlannedCreative): Promise<QualityScores> {
    // In a full implementation, we'd use the AIProvider to evaluate the script text,
    // the emotional consistency, etc. Here we simulate a scoring mechanism.

    let hook_score = 80;
    let copy_score = 85;
    let cta_score = 90;
    let visual_score = 75;
    let motion_score = plan.dna.style === 'dynamic' ? 90 : 70;
    let readability_score = 95;
    let trust_score = plan.dna.mental_trigger === 'Autoridade' ? 90 : 70;
    let viral_score = plan.dna.mental_trigger === 'Curiosidade' ? 95 : 60;

    // Penalty for empty text
    if (!plan.dna.hook) hook_score = 30;
    if (!plan.dna.cta) cta_score = 30;

    const scores = [hook_score, copy_score, cta_score, visual_score, motion_score, readability_score, trust_score, viral_score];
    const overall_score = Math.floor(scores.reduce((a, b) => a + b, 0) / scores.length);

    const passed = overall_score >= this.MIN_SCORE_THRESHOLD;

    return {
      hook_score,
      copy_score,
      cta_score,
      visual_score,
      motion_score,
      readability_score,
      trust_score,
      viral_score,
      overall_score,
      passed
    };
  }
}

export const qualityAnalyzerService = new QualityAnalyzerService();
