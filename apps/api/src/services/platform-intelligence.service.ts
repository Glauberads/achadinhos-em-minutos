import { featureFlagService } from './feature-flag.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PlatformRules {
  platform: string;
  max_duration_seconds: number;
  ideal_duration_seconds: number;
  max_text_characters_per_scene: number;
  headline_max_words: number;
  banned_words: string[];
  pacing: 'fast' | 'moderate' | 'slow';
  aspect_ratio: string;
}

export class PlatformIntelligenceService {
  private readonly rulesBase: Record<string, PlatformRules> = {
    'TikTok': {
      platform: 'TikTok',
      max_duration_seconds: 60,
      ideal_duration_seconds: 15,
      max_text_characters_per_scene: 40,
      headline_max_words: 6,
      banned_words: ['link na bio', 'compre', 'venda', 'dinheiro'],
      pacing: 'fast',
      aspect_ratio: '9:16'
    },
    'Instagram Reels': {
      platform: 'Instagram Reels',
      max_duration_seconds: 90,
      ideal_duration_seconds: 20,
      max_text_characters_per_scene: 50,
      headline_max_words: 8,
      banned_words: ['link na bio', 'TikTok'],
      pacing: 'fast',
      aspect_ratio: '9:16'
    },
    'YouTube Shorts': {
      platform: 'YouTube Shorts',
      max_duration_seconds: 60,
      ideal_duration_seconds: 30,
      max_text_characters_per_scene: 60,
      headline_max_words: 10,
      banned_words: ['TikTok', 'Reels'],
      pacing: 'moderate',
      aspect_ratio: '9:16'
    },
    'Facebook Ads': {
      platform: 'Facebook Ads',
      max_duration_seconds: 120,
      ideal_duration_seconds: 45,
      max_text_characters_per_scene: 80,
      headline_max_words: 12,
      banned_words: ['antes e depois', 'cura', 'garantido'],
      pacing: 'moderate',
      aspect_ratio: '4:5'
    }
  };

  async getPlatformRules(platformName: string): Promise<PlatformRules> {
    const isV2 = await featureFlagService.isEnabled('creative_intelligence_v2');
    
    // Na V1 ou fallback
    const matched = this.rulesBase[platformName];
    if (matched) return matched;

    // Fallback genérico para 9:16
    return {
      platform: platformName || 'General Vertical',
      max_duration_seconds: 60,
      ideal_duration_seconds: 15,
      max_text_characters_per_scene: 50,
      headline_max_words: 8,
      banned_words: [],
      pacing: 'fast',
      aspect_ratio: '9:16'
    };
  }
}

export const platformIntelligenceService = new PlatformIntelligenceService();
