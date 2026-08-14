import { describe, it, expect } from 'vitest';
import { CreativeDnaV2Schema } from '@achadinhos/shared';

describe('CreativeDnaV2Schema', () => {
  const validCreativeDna = {
    creative_dna_version: "v2",
    product_category: "Tech",
    marketplace: "Shopee",
    offer_strength: "High",
    price_attractiveness: "Very attractive",
    audience_temperature: "hot",
    awareness_level: "solution_aware",
    risk_level: "low",
    compliance_notes: "None",
    claims_allowed: ["Save time"],
    claims_blocked: ["Cures cancer"],
    target_audience: "Men 18-35",
    pain_points: ["Too slow"],
    desired_outcome: "Fast performance",
    big_promise: "10x faster",
    unique_mechanism: "New chip",
    offer_angle: "Discount",
    emotional_driver: "Status",
    primary_hook: "Look at this speed",
    secondary_hook: "Are you tired of waiting?",
    cta_strategy: "Urgency",
    visual_style: "Dynamic",
    color_strategy: "Neon",
    typography_strategy: "Bold",
    motion_strategy: "Fast cuts",
    platform_strategy: "TikTok",
    urgency_strategy: "Limited time",
    social_proof_strategy: "Reviews",
    trust_strategy: "Guarantee",
    objection_strategy: "Free return",
    conversion_goal: "Add to cart"
  };

  it('should pass with a valid CreativeDNA', () => {
    const result = CreativeDnaV2Schema.safeParse(validCreativeDna);
    expect(result.success).toBe(true);
  });

  it('should fail with an invalid CreativeDNA (missing required field)', () => {
    const invalidDna = { ...validCreativeDna };
    delete (invalidDna as any).primary_hook;

    const result = CreativeDnaV2Schema.safeParse(invalidDna);
    expect(result.success).toBe(false);
  });

  it('should fail with an invalid enum value', () => {
    const invalidDna = { ...validCreativeDna, audience_temperature: "freezing" };
    const result = CreativeDnaV2Schema.safeParse(invalidDna);
    expect(result.success).toBe(false);
  });
});
