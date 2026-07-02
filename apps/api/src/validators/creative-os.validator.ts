import { z } from 'zod';

// ==========================================
// INTELLIGENCE ENGINES (Analíticos)
// ==========================================

export const visualIntelligenceSchema = z.object({
  imageUrl: z.string().url(),
  productName: z.string().optional()
});
export type VisualIntelligenceInputDTO = z.infer<typeof visualIntelligenceSchema>;

export const visualIntelligenceOutputSchema = z.object({
  hasFace: z.boolean(),
  dominantColors: z.array(z.string()),
  qualityScore: z.number().min(0).max(100),
  suggestedFocus: z.string()
});
export type VisualIntelligenceOutputDTO = z.infer<typeof visualIntelligenceOutputSchema>;


export const marketIntelligenceSchema = z.object({
  niche: z.string(),
  price: z.number().optional()
});
export type MarketIntelligenceInputDTO = z.infer<typeof marketIntelligenceSchema>;

export const marketIntelligenceOutputSchema = z.object({
  targetAudience: z.string(),
  painPoints: z.array(z.string()),
  marketTrends: z.array(z.string())
});
export type MarketIntelligenceOutputDTO = z.infer<typeof marketIntelligenceOutputSchema>;


export const creativeIntelligenceSchema = z.object({
  platform: z.enum(['tiktok', 'reels', 'shorts']),
  audience: z.string()
});
export type CreativeIntelligenceInputDTO = z.infer<typeof creativeIntelligenceSchema>;

export const creativeIntelligenceOutputSchema = z.object({
  bestPractices: z.array(z.string()),
  bannedWords: z.array(z.string())
});
export type CreativeIntelligenceOutputDTO = z.infer<typeof creativeIntelligenceOutputSchema>;


// ==========================================
// CREATIVE STRATEGY (O Cérebro)
// ==========================================

export const creativeStrategySchema = z.object({
  visualData: visualIntelligenceOutputSchema,
  marketData: marketIntelligenceOutputSchema,
  creativeData: creativeIntelligenceOutputSchema
});
export type CreativeStrategyInputDTO = z.infer<typeof creativeStrategySchema>;

export const creativeStrategyOutputSchema = z.object({
  angle: z.string(),
  toneOfVoice: z.string(),
  durationSeconds: z.number().min(5).max(60),
  coreMessage: z.string()
});
export type CreativeStrategyOutputDTO = z.infer<typeof creativeStrategyOutputSchema>;


// ==========================================
// CREATIVE ENGINES (Executores)
// ==========================================

export const layoutEngineSchema = z.object({
  platform: z.string(),
  hasFace: z.boolean()
});
export type LayoutEngineInputDTO = z.infer<typeof layoutEngineSchema>;

export const layoutEngineOutputSchema = z.object({
  paddingTop: z.number(),
  paddingBottom: z.number(),
  safeZones: z.boolean(),
  imageAlignment: z.enum(['center', 'top', 'bottom', 'fill'])
});
export type LayoutEngineOutputDTO = z.infer<typeof layoutEngineOutputSchema>;


export const typographyEngineSchema = z.object({
  toneOfVoice: z.string(),
  angle: z.string()
});
export type TypographyEngineInputDTO = z.infer<typeof typographyEngineSchema>;

export const typographyEngineOutputSchema = z.object({
  primaryFont: z.string(),
  secondaryFont: z.string(),
  baseSize: z.number(),
  weight: z.string()
});
export type TypographyEngineOutputDTO = z.infer<typeof typographyEngineOutputSchema>;


export const colorEngineSchema = z.object({
  dominantColors: z.array(z.string()),
  toneOfVoice: z.string()
});
export type ColorEngineInputDTO = z.infer<typeof colorEngineSchema>;

export const colorEngineOutputSchema = z.object({
  primaryColor: z.string(),
  accentColor: z.string(),
  textColor: z.string(),
  backgroundColor: z.string()
});
export type ColorEngineOutputDTO = z.infer<typeof colorEngineOutputSchema>;


export const hookEngineSchema = z.object({
  angle: z.string(),
  painPoints: z.array(z.string()),
  platform: z.string()
});
export type HookEngineInputDTO = z.infer<typeof hookEngineSchema>;

export const hookEngineOutputSchema = z.object({
  text: z.string(),
  duration: z.number(),
  visualCue: z.string().optional()
});
export type HookEngineOutputDTO = z.infer<typeof hookEngineOutputSchema>;


export const ctaEngineSchema = z.object({
  angle: z.string(),
  price: z.number().optional()
});
export type CTAEngineInputDTO = z.infer<typeof ctaEngineSchema>;

export const ctaEngineOutputSchema = z.object({
  text: z.string(),
  urgencyLevel: z.enum(['low', 'medium', 'high'])
});
export type CTAEngineOutputDTO = z.infer<typeof ctaEngineOutputSchema>;


export const storyboardEngineSchema = z.object({
  coreMessage: z.string(),
  durationSeconds: z.number(),
  hook: hookEngineOutputSchema,
  cta: ctaEngineOutputSchema
});
export type StoryboardEngineInputDTO = z.infer<typeof storyboardEngineSchema>;

export const storyboardEngineOutputSchema = z.object({
  scenes: z.array(z.object({
    id: z.string(),
    duration: z.number(),
    textOverlay: z.string(),
    voiceover: z.string().optional()
  }))
});
export type StoryboardEngineOutputDTO = z.infer<typeof storyboardEngineOutputSchema>;


export const motionEngineSchema = z.object({
  scenes: storyboardEngineOutputSchema.shape.scenes,
  toneOfVoice: z.string()
});
export type MotionEngineInputDTO = z.infer<typeof motionEngineSchema>;

export const motionEngineOutputSchema = z.object({
  transitions: z.array(z.object({
    sceneId: z.string(),
    type: z.string(),
    durationMs: z.number()
  }))
});
export type MotionEngineOutputDTO = z.infer<typeof motionEngineOutputSchema>;


// ==========================================
// ORCHESTRATION & REVIEW
// ==========================================

export const dualScoreSchema = z.object({
  visualScore: z.number().min(0).max(100),
  conversionScore: z.number().min(0).max(100)
});
export type DualScoreDTO = z.infer<typeof dualScoreSchema>;

export const creativeReviewerSchema = z.object({
  layout: layoutEngineOutputSchema,
  typography: typographyEngineOutputSchema,
  color: colorEngineOutputSchema,
  storyboard: storyboardEngineOutputSchema,
  motion: motionEngineOutputSchema
});
export type CreativeReviewerInputDTO = z.infer<typeof creativeReviewerSchema>;

export const creativeReviewerOutputSchema = z.object({
  approved: z.boolean(),
  scores: dualScoreSchema,
  feedback: z.array(z.string())
});
export type CreativeReviewerOutputDTO = z.infer<typeof creativeReviewerOutputSchema>;


// ==========================================
// LEARNING ENGINE
// ==========================================

export const learningEngineSchema = z.object({
  creativeId: z.string(),
  performanceMetrics: z.object({
    views: z.number(),
    clicks: z.number(),
    ctr: z.number()
  })
});
export type LearningEngineInputDTO = z.infer<typeof learningEngineSchema>;

export const learningEngineOutputSchema = z.object({
  success: z.boolean(),
  insightsGenerated: z.number()
});
export type LearningEngineOutputDTO = z.infer<typeof learningEngineOutputSchema>;
