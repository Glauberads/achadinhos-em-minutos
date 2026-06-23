import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { supabaseAdmin } from '../lib/supabase';
import { telegramQueue } from '../lib/queue';
import { ShopeeProvider } from '../providers/products/shopee.provider';
import { MercadoLivreProvider } from '../providers/products/mercadolivre.provider';

export const campaignWorker = new Worker(
  'campaign-runner',
  async (job) => {
    const { campaign_id } = job.data;
    console.log(`[Campaign Runner] Iniciando campanha: ${campaign_id}`);

    // 1. Aplicar Lock no Redis para evitar concorrência
    const lockKey = `lock:campaign:${campaign_id}`;
    const acquired = await redisConnection.set(lockKey, '1', 'NX', 'EX', 300); // 5 minutos max lock
    if (!acquired) {
      console.log(`[Campaign Runner] Campanha ${campaign_id} já está rodando (Locked). Abortando.`);
      return;
    }

    try {
      // 2. Buscar Campanha Ativa
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', campaign_id)
        .eq('status', 'active')
        .single();

      if (!campaign) {
        console.log(`[Campaign Runner] Campanha ${campaign_id} não encontrada ou inativa.`);
        return;
      }

      // 3. Escolher o Provider
      const provider = campaign.platform === 'shopee' 
        ? new ShopeeProvider() 
        : new MercadoLivreProvider();

      const filters = {
        keyword: campaign.keyword,
        category: campaign.category,
        limit: 10, // Default limite
        ...campaign.filters
      };

      // 4. Buscar Produtos
      const rawProducts = await provider.search(filters, campaign.user_id);

      let importedCount = 0;
      let queuedCount = 0;

      for (const p of rawProducts) {
        // 5. Salvar produto no banco (Upsert ou ignorando duplicadas)
        // Como external_id + platform é unique parcial, supabase dá erro ou upsert resolve
        const { data: insertedProduct, error: productError } = await supabaseAdmin
          .from('products')
          .upsert({
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
            metadata: p.metadata
          }, { onConflict: 'user_id, platform, external_id' })
          .select()
          .single();

        if (productError) {
          console.error('[Campaign Runner] Erro ao salvar produto:', productError);
          continue;
        }
        importedCount++;

        // 6. Criar Scheduled Post e regras de affiliate_link
        const productId = insertedProduct.id;
        const groupId = campaign.telegram_group_id;

        const hasAffiliate = !!insertedProduct.affiliate_link;
        const postStatus = hasAffiliate ? 'pending' : 'failed';
        const errorMessage = hasAffiliate ? null : 'missing_affiliate_link';

        const { data: post, error: postError } = await supabaseAdmin
          .from('scheduled_posts')
          .insert({
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            product_id: productId,
            group_id: groupId,
            status: postStatus,
            error_message: errorMessage
          })
          .select()
          .single();

        // O Unique Index Parcial (user_id, product_id, group_id) evitará duplicações se der erro.
        if (postError) {
          // Se for violação de unique, apenas ignora pois já mandou/agendou
          if (postError.code === '23505') {
            console.log(`[Campaign Runner] Produto ${productId} já processado para grupo ${groupId}`);
          } else {
            console.error('[Campaign Runner] Erro ao criar post agendado:', postError);
          }
          continue;
        }

        // 7. Enfileirar Telegram Send se pending
        if (hasAffiliate) {
          await telegramQueue.add('send', { scheduledPostId: post.id });
          queuedCount++;
          
          await supabaseAdmin
            .from('scheduled_posts')
            .update({ status: 'queued', queued_at: new Date().toISOString() })
            .eq('id', post.id);
        }
      }

      // 8. Atualizar next_run_at da campanha (baseado no cron seria melhor, 
      // mas para MVP vamos pular X minutos ou forçar algo simples se recurrence for horas)
      // Vamos assumir que recurrence_cron = "60" = a cada 60 minutos (simplificado)
      const nextRunAt = new Date();
      const minutes = parseInt(campaign.recurrence_cron) || 60;
      nextRunAt.setMinutes(nextRunAt.getMinutes() + minutes);

      await supabaseAdmin
        .from('campaigns')
        .update({ next_run_at: nextRunAt.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', campaign.id);

      // 9. Registrar System Log
      await supabaseAdmin.from('system_logs').insert({
        user_id: campaign.user_id,
        action: 'campaign_run',
        entity: 'campaigns',
        message: `Campanha '${campaign.name}' rodou: ${importedCount} importados, ${queuedCount} agendados.`
      });

      console.log(`[Campaign Runner] Concluído: ${queuedCount} posts agendados.`);

    } catch (err: any) {
      console.error(`[Campaign Runner] Falha fatal:`, err.message);
      // Registrar log de erro grave
      await supabaseAdmin.from('system_logs').insert({
        user_id: job.data.user_id, // Pode falhar se data.user_id n existir, mas ok
        action: 'campaign_error',
        entity: 'campaigns',
        message: `Erro fatal ao rodar campanha ${campaign_id}: ${err.message}`
      });
    } finally {
      // Liberar o Lock
      await redisConnection.del(lockKey);
    }
  },
  { connection: redisConnection, concurrency: parseInt(process.env.WORKER_CONCURRENCY || '1') }
);
  console.error(`[Worker: Campaign] Job ${job?.id} falhou:`, err);
});
