import { productLinkParserService } from './product-link-parser.service';
import { creativeRepository } from '../repositories/creative.repository';
import { addCreativeRenderJob } from '../queues/creative-render.queue';
import { eventBus, CreativeGenerationStartedEvent, CreativeUpdatedEvent, CreativeDeletedEvent } from '../events';
import { creativePlannerService } from './creative-planner.service';
import { qualityAnalyzerService } from './quality-analyzer.service';
import { abGeneratorService } from './ab-generator.service';
import { supabaseAdmin } from '../lib/supabase';
import { CreativeImageUploadStarted, CreativeImageUploaded, CreativeImageUploadFailed, CreativeFallbackAccepted } from '../events';

export class CreativeStudioService {
  async generateFromLink(url: string, style: string, userId: string) {
    // 1. Extrair Produto
    const product = await productLinkParserService.parseAndFetch(url);

    // 2. Orquestração da V2: Intelligence -> Brain -> Planner -> Analyzer (Batch Generation)
    const BATCH_SIZE = 3;
    const plans = [];
    
    // Gera as variações (com cache ativo, isso será praticamente instantâneo)
    for (let i = 0; i < BATCH_SIZE; i++) {
      const p = await creativePlannerService.planCreative(product);
      const scores = await qualityAnalyzerService.analyze(p);
      plans.push({ plan: p, scores });
    }

    // 3. Escolhe a melhor versão baseada no overall_score
    plans.sort((a, b) => b.scores.overall_score - a.scores.overall_score);
    const bestMatch = plans[0];
    
    const plan = bestMatch.plan;
    const scores = bestMatch.scores;

    // 3. A/B Generator (Gera Versão A e B)
    const versions = abGeneratorService.generateVersions(plan);

    // 4. Salvar Versão A (Principal)
    const creativeA = await creativeRepository.create({
      user_id: userId,
      marketplace: product.marketplace,
      product_url: product.url,
      title: product.title,
      image_urls: product.images || [],
      thumbnail_url: product.images?.[0] || 'https://placehold.co/600x800',
      status: 'draft',
      generation_status: 'pending_review',
      buyer_persona: plan.intelligence.buyer_persona,
      creative_dna: versions.versionA.dna,
      quality_scores: scores,
      conversion_score: plan.intelligence.conversion_score,
      script: versions.versionA.script,
      scenes: versions.versionA.scenes,
      metadata: {
        creative_type: 'video',
        external_product_id: product.id,
        product_image_url: product.images?.[0] || 'https://placehold.co/600x800',
        source_image_strategy: product.source_image_strategy || 'fallback',
        original_image_found: product.original_image_found ?? false,
        generation_strategy: 'batch',
        selected_variant_score: scores.overall_score,
        quality_reason: scores.passed ? 'Aprovado pelo Quality Analyzer' : 'Melhor opção entre os gerados'
      }
    });

    // 5. Salvar Versão B (Teste)
    const creativeB = await creativeRepository.create({
      user_id: userId,
      marketplace: product.marketplace,
      product_url: product.url,
      title: product.title,
      image_urls: product.images || [],
      thumbnail_url: product.images?.[0] || 'https://placehold.co/600x800',
      status: 'draft',
      generation_status: 'pending_review',
      parent_id: creativeA.id, // Liga A e B
      buyer_persona: plan.intelligence.buyer_persona,
      creative_dna: versions.versionB.dna,
      quality_scores: scores,
      conversion_score: plan.intelligence.conversion_score,
      script: versions.versionB.script,
      scenes: versions.versionB.scenes,
      metadata: {
        creative_type: 'video',
        external_product_id: product.id,
        product_image_url: product.images?.[0] || 'https://placehold.co/600x800',
        source_image_strategy: product.source_image_strategy || 'fallback',
        original_image_found: product.original_image_found ?? false,
        generation_strategy: 'batch',
        selected_variant_score: scores.overall_score,
        quality_reason: scores.passed ? 'Aprovado pelo Quality Analyzer' : 'Melhor opção entre os gerados'
      }
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

  async uploadProductImage(id: string, userId: string, buffer: Buffer, mimetype: string) {
    const ext = mimetype.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const filename = `${userId}/${id}/${timestamp}.${ext}`;

    eventBus.emit(new CreativeImageUploadStarted({ creative_id: id, filename }, { user_id: userId, source: 'API' }));

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('creative-images')
      .upload(filename, buffer, { contentType: mimetype, upsert: true });

    if (uploadError || !uploadData) {
      eventBus.emit(new CreativeImageUploadFailed({ creative_id: id, error: uploadError?.message || 'Upload failed' }, { user_id: userId, source: 'API' }));
      throw new Error(`Upload failed: ${uploadError?.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage.from('creative-images').getPublicUrl(uploadData.path);
    const uploadedUrl = urlData.publicUrl;

    const creative = await this.getCreative(id, userId);
    if (!creative) throw new Error('Criativo não encontrado');

    const oldStrategy = creative.metadata?.source_image_strategy;
    const oldImages = creative.image_urls || [];

    const updatedMetadata = {
      ...creative.metadata,
      product_image_url: uploadedUrl,
      source_image_strategy: 'manual_upload',
      original_image_found: true,
      manual_upload_at: new Date().toISOString(),
      previous_source_image_strategy: oldStrategy,
      manual_upload_filename: filename
    };

    const updated = await this.updateCreative(id, userId, {
      image_urls: [uploadedUrl, ...oldImages],
      thumbnail_url: uploadedUrl,
      metadata: updatedMetadata
    });

    eventBus.emit(new CreativeImageUploaded({ creative_id: id, url: uploadedUrl }, { user_id: userId, source: 'API' }));
    return { success: true, creative: updated };
  }

  async acceptFallbackImage(id: string, userId: string) {
    const creative = await this.getCreative(id, userId);
    if (!creative) throw new Error('Criativo não encontrado');

    const updatedMetadata = {
      ...creative.metadata,
      original_image_found: false,
      user_accepted_fallback: true,
      source_image_strategy: 'generic_fallback_accepted'
    };

    const updated = await this.updateCreative(id, userId, {
      metadata: updatedMetadata
    });

    eventBus.emit(new CreativeFallbackAccepted({ creative_id: id, strategy: 'generic_fallback_accepted' }, { user_id: userId, source: 'API' }));
    return { success: true, creative: updated };
  }
}

export const creativeStudioService = new CreativeStudioService();
