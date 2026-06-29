import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { telegramQueue } from '../lib/queue';
import { campaignRepository, productRepository, scheduledPostRepository } from '../repositories';
import { ShopeeProvider } from '../providers/products/shopee.provider';
import { MercadoLivreProvider } from '../providers/products/mercadolivre.provider';
import { eventBus, CampaignStartedEvent, SearchFinishedEvent, ProductImportedEvent, TelegramQueuedEvent, CampaignFinishedEvent, WorkerFailedEvent } from '../events';

/**
 * Campaign Runner Worker — Refatorado para usar:
 * - Repositories (CampaignRepository, ProductRepository, ScheduledPostRepository)
 * - AuditService
 * - Providers Pattern
 * 
 * CORRIGIDO: Erro de sintaxe nas linhas 165-166 do arquivo original
 * (código solto fora do Worker).
 */
export const campaignWorker = new Worker(
  'campaign-runner',
  async (job) => {
    const { campaign_id } = job.data;
    console.log(`[Campaign Runner] Iniciando campanha: ${campaign_id}`);

    // 1. Lock anti-concorrência no Redis
    const lockKey = `lock:campaign:${campaign_id}`;
    const acquired = await redisConnection.set(lockKey, '1', 'EX', 300, 'NX');
    if (!acquired) {
      console.log(`[Campaign Runner] Campanha ${campaign_id} já está rodando (Locked). Abortando.`);
      return;
    }

    try {
      // 2. Buscar Campanha Ativa via Repository
      const { data: campaign } = await campaignRepository.findActiveById(campaign_id);
      if (!campaign) {
        console.log(`[Campaign Runner] Campanha ${campaign_id} não encontrada ou inativa.`);
        return;
      }

      eventBus.emit(new CampaignStartedEvent(
        { campaign_id },
        { user_id: campaign.user_id, source: 'campaign-runner' }
      ));

      // 3. Escolher o Provider
      const provider = campaign.platform === 'shopee'
        ? new ShopeeProvider()
        : new MercadoLivreProvider();

      const filters = {
        keyword: campaign.keyword,
        category: campaign.category,
        limit: 10,
        ...campaign.filters,
      };

      // 4. Buscar Produtos
      const rawProducts = await provider.search(filters, campaign.user_id);

      eventBus.emit(new SearchFinishedEvent(
        { keyword: filters.keyword || 'ofertas', platform: campaign.platform, total_found: rawProducts.length, job_id: job.id },
        { user_id: campaign.user_id, source: 'campaign-runner' }
      ));

      let importedCount = 0;
      let queuedCount = 0;

      for (const p of rawProducts) {
        // 5. Upsert produto via Repository
        const { data: insertedProduct, error: productError } = await productRepository.upsert({
          user_id: campaign.user_id,
          platform: p.platform,
          external_id: p.external_id,
          title: p.title,
          original_price: p.original_price,
          current_price: p.current_price,
          discount: p.discount,
          image_url: p.image_url,
          source_url: p.source_url,
          affiliate_link: p.affiliate_link,
          sold_count: p.sold_count,
          free_shipping: p.free_shipping,
          metadata: p.metadata,
        });

        if (productError) {
          console.error('[Campaign Runner] Erro ao salvar produto:', productError);
          continue;
        }

        eventBus.emit(new ProductImportedEvent(
          { product_id: insertedProduct.id, platform: p.platform, external_id: p.external_id },
          { user_id: campaign.user_id, source: 'campaign-runner' }
        ));

        importedCount++;

        // 6. Criar Scheduled Post via Repository
        const productId = insertedProduct.id;
        const groupId = campaign.telegram_group_id;
        const hasAffiliate = !!insertedProduct.affiliate_link;
        const postStatus = hasAffiliate ? 'pending' : 'failed';
        const errorMessage = hasAffiliate ? null : 'missing_affiliate_link';

        const { data: post, error: postError } = await scheduledPostRepository.create({
          user_id: campaign.user_id,
          campaign_id: campaign.id,
          product_id: productId,
          group_id: groupId,
          status: postStatus,
          error_message: errorMessage,
        });

        // Unique Index Parcial evita duplicações
        if (postError) {
          if (postError.code === '23505') {
            console.log(`[Campaign Runner] Produto ${productId} já processado para grupo ${groupId}`);
          } else {
            console.error('[Campaign Runner] Erro ao criar post agendado:', postError);
          }
          continue;
        }

        // 7. Enfileirar para Telegram Send se possui affiliate
        if (hasAffiliate && post) {
          await telegramQueue.add('send', { scheduledPostId: post.id });
          queuedCount++;

          await scheduledPostRepository.updateStatus(post.id, 'queued', {
            queued_at: new Date().toISOString(),
          });

          eventBus.emit(new TelegramQueuedEvent(
            { post_id: post.id, group_id: groupId, product_id: productId },
            { user_id: campaign.user_id, source: 'campaign-runner' }
          ));
        }
      }

      // 8. Atualizar next_run_at via Repository
      const nextRunAt = new Date();
      const minutes = parseInt(campaign.recurrence_cron) || 60;
      nextRunAt.setMinutes(nextRunAt.getMinutes() + minutes);

      await campaignRepository.updateNextRun(campaign.id, nextRunAt.toISOString());

      // 9. Emissão de evento de finalização
      eventBus.emit(new CampaignFinishedEvent(
        { campaign_id: campaign.id, imported_count: importedCount, queued_count: queuedCount },
        { user_id: campaign.user_id, source: 'campaign-runner' }
      ));

      console.log(`[Campaign Runner] Concluído: ${queuedCount} posts agendados.`);

    } catch (err: any) {
      console.error(`[Campaign Runner] Falha fatal:`, err.message);

      // Emissão de evento de erro
      eventBus.emit(new WorkerFailedEvent(
        { worker_name: 'campaign-runner', job_id: job.id || 'unknown', error_message: err.message },
        { user_id: job.data.user_id || 'unknown', source: 'campaign-runner' }
      ));
    } finally {
      // Liberar Lock
      await redisConnection.del(lockKey);
    }
  },
  { connection: redisConnection, concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1') }
);

campaignWorker.on('failed', (job, err) => {
  console.error(`[Worker: Campaign] Job ${job?.id} falhou:`, err);
});
