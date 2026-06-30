import { productLinkParserService } from './product-link-parser.service';
import { creativeRepository } from '../repositories/creative.repository';
import { addCreativeRenderJob } from '../queues/creative-render.queue';
import { eventBus, CreativeGenerationStartedEvent, CreativeUpdatedEvent, CreativeDeletedEvent } from '../events';
import { creativePlannerService } from './creative-planner.service';
import { qualityAnalyzerService } from './quality-analyzer.service';
import { abGeneratorService } from './ab-generator.service';

export class CreativeStudioService {
  async generateFromLink(url: string, style: string, userId: string) {
    // 1. Extrair Produto
    const product = await productLinkParserService.parseAndFetch(url);

    // 2. Orquestração da V2: Intelligence -> Brain -> Planner -> Analyzer
    let plan: any;
    let scores: any;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      plan = await creativePlannerService.planCreative(product);
      scores = await qualityAnalyzerService.analyze(plan);

      if (scores.passed) {
        break; // Aprovado pelo Quality Analyzer
      }
      console.warn(`[QualityAnalyzer] Score baixo (${scores.overall_score}). Refazendo tentativa ${attempts}/${MAX_ATTEMPTS}`);
    }

    // 3. A/B Generator (Gera Versão A e B)
    const versions = abGeneratorService.generateVersions(plan);

    // 4. Salvar Versão A (Principal)
    const creativeA = await creativeRepository.create({
      user_id: userId,
      product_id: product.id,
      marketplace: product.marketplace,
      product_url: product.url,
      title: product.title,
      image_urls: product.images,
      status: 'draft',
      generation_status: 'pending_review',
      buyer_persona: plan.intelligence.buyer_persona,
      creative_dna: versions.versionA.dna,
      quality_scores: scores,
      conversion_score: plan.intelligence.conversion_score,
      script: versions.versionA.script,
      scenes: versions.versionA.scenes
    });

    // 5. Salvar Versão B (Teste)
    const creativeB = await creativeRepository.create({
      user_id: userId,
      product_id: product.id,
      marketplace: product.marketplace,
      product_url: product.url,
      title: product.title,
      image_urls: product.images,
      status: 'draft',
      generation_status: 'pending_review',
      parent_id: creativeA.id, // Liga A e B
      buyer_persona: plan.intelligence.buyer_persona,
      creative_dna: versions.versionB.dna,
      quality_scores: scores, // simplificação
      conversion_score: plan.intelligence.conversion_score,
      script: versions.versionB.script,
      scenes: versions.versionB.scenes
    });

    eventBus.emit(new CreativeGenerationStartedEvent({ creative_id: creativeA.id!, product_url: url }, { user_id: userId, source: 'CreativeStudioService' }));

    return {
      creative_id_a: creativeA.id,
      creative_id_b: creativeB.id,
      status: 'pending_review',
      message: 'Criativos gerados (Versões A e B). Aguardando revisão no Storyboard Editor.'
    };
  }

  async getCreatives(userId: string) {
    return await creativeRepository.findByUserId(userId);
  }

  async getCreative(id: string, userId: string) {
    return await creativeRepository.findById(id, userId);
  }

  async updateCreative(id: string, userId: string, data: any) {
    const updated = await creativeRepository.update(id, userId, data);
    eventBus.emit(new CreativeUpdatedEvent({ creative_id: id }, { user_id: userId, source: 'CreativeStudioService' }));
    return updated;
  }

  async deleteCreative(id: string, userId: string) {
    await creativeRepository.delete(id, userId);
    eventBus.emit(new CreativeDeletedEvent({ creative_id: id }, { user_id: userId, source: 'CreativeStudioService' }));
  }

  async triggerRender(id: string, userId: string) {
    await creativeRepository.updateStatus(id, 'draft', 'pending');
    await addCreativeRenderJob(id, userId);
    return { success: true, message: 'Renderização reenfileirada' };
  }
}

export const creativeStudioService = new CreativeStudioService();
