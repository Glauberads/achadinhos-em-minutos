import { PlannedCreative } from './creative-planner.service';
import { hookEngineService } from './hook-engine.service';
import { ctaEngineService } from './cta-engine.service';

export interface ABVersions {
  versionA: PlannedCreative;
  versionB: PlannedCreative;
}

export class ABGeneratorService {
  generateVersions(basePlan: PlannedCreative): ABVersions {
    // Version A is the base plan
    const versionA = JSON.parse(JSON.stringify(basePlan));

    // Version B will have variations
    const versionB = JSON.parse(JSON.stringify(basePlan));
    
    // Vary the Hook
    // Force a different hook by providing a slightly varied strategy or just re-rolling
    // Since our library is small, let's just reverse the strategy to get a different hook
    const altStrategy = {
      ...basePlan.strategy,
      mental_trigger: basePlan.strategy.mental_trigger === 'Urgência' ? 'Curiosidade' : 'Urgência'
    };

    const altHook = hookEngineService.generateHook(basePlan.intelligence, altStrategy);
    const altCta = ctaEngineService.generateCTA(basePlan.intelligence, altStrategy);

    versionB.dna.hook = altHook;
    versionB.dna.cta = altCta;
    versionB.dna.mental_trigger = altStrategy.mental_trigger;
    
    // Update scenes in version B
    if (versionB.scenes && versionB.scenes.length >= 3) {
      versionB.scenes[0].text = altHook;
      versionB.scenes[versionB.scenes.length - 1].text = altCta;
    }

    // Update script in version B
    if (versionB.script && versionB.script.length >= 3) {
      versionB.script[0].text = altHook;
      versionB.script[versionB.script.length - 1].text = altCta;
    }

    return {
      versionA,
      versionB
    };
  }
}

export const abGeneratorService = new ABGeneratorService();
