import { Worker, UnrecoverableError } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { scheduledPostRepository } from '../repositories';
import { telegramService } from '../services';
import { eventBus, TelegramSentEvent, TelegramFailedEvent, WorkerFailedEvent } from '../events';

const TELEGRAM_SEND_INTERVAL_SECONDS = parseInt(process.env.TELEGRAM_SEND_INTERVAL_SECONDS || '30');

/**
 * Telegram Sender Worker — Refatorado para usar:
 * - TelegramService (construção de mensagem + envio)
 * - ScheduledPostRepository
 * - AuditService
 * 
 * Elimina duplicação da lógica de construção de mensagem
 * que antes existia tanto aqui quanto em routes/telegram.ts.
 */
export const telegramWorker = new Worker(
  'telegram-send',
  async (job) => {
    const { scheduledPostId } = job.data;
    console.log(`[Telegram Sender] Processando post ${scheduledPostId}`);

    // 1. Buscar Post + Produto + Grupo via Repository
    const { data: post, error: postError } = await scheduledPostRepository.findWithRelations(scheduledPostId);

    if (postError || !post) {
      console.error(`[Telegram Sender] Post não encontrado: ${scheduledPostId}`);
      return;
    }

    if (post.status === 'sent' || post.status === 'failed') {
      console.log(`[Telegram Sender] Post já processado anteriormente. Ignorando.`);
      return;
    }

    const { product, group, user_id } = post;

    // 2. Validação do Affiliate Link
    if (!product.affiliate_link) {
      await scheduledPostRepository.updateStatus(post.id, 'failed', {
        error_message: 'missing_affiliate_link',
      });

      eventBus.emit(new TelegramFailedEvent(
        { post_id: post.id, group_id: group.id, product_id: product.id, error_message: 'Produto sem link de afiliado' },
        { user_id, source: 'telegram-sender' }
      ));
      return;
    }

    // 3. Rate Limit no Redis pelo Group ID
    const lockKey = `lock:telegram:${group.id}`;
    const acquired = await redisConnection.set(lockKey, '1', 'EX', TELEGRAM_SEND_INTERVAL_SECONDS, 'NX');
    if (!acquired) {
      console.log(`[Telegram Sender] Rate Limit atingido para o grupo ${group.id}. Atrasando envio.`);
      throw new Error(`Rate limit active for group ${group.id}`);
    }

    try {
      // 4. Buscar Token do Bot via Service
      const botToken = await telegramService.getBotToken(user_id);
      if (!botToken) {
        throw new UnrecoverableError('Credenciais do Telegram ausentes ou desconectadas.');
      }

      // 5. Construir mensagem via Service (eliminando duplicação)
      const caption = telegramService.buildOfferMessage(product, true);

      // 6. Enviar via Service
      const result = await telegramService.sendMessage({
        botToken,
        chatId: group.external_group_id,
        caption,
        imageUrl: product.image_url,
      });

      if (!result.ok) {
        throw new Error(`Telegram API Error: ${result.description}`);
      }

      // 7. Sucesso: Atualizar estado via Repository
      await scheduledPostRepository.updateStatus(post.id, 'sent', {
        sent_at: new Date().toISOString(),
      });

      await telegramService.logSendResult({
        userId: user_id,
        productId: product.id,
        groupId: group.id,
        status: 'success',
      });

      eventBus.emit(new TelegramSentEvent(
        { post_id: post.id, group_id: group.id, product_id: product.id },
        { user_id, source: 'telegram-sender' }
      ));

      console.log(`[Telegram Sender] Post ${post.id} enviado com sucesso!`);

    } catch (err: any) {
      console.error(`[Telegram Sender] Erro ao enviar post ${post.id}:`, err.message);

      if (err instanceof UnrecoverableError || err.message.includes('Credenciais')) {
        // Marca como failed — não pode recuperar
        await scheduledPostRepository.updateStatus(post.id, 'failed', {
          error_message: err.message,
        });

        eventBus.emit(new TelegramFailedEvent(
          { post_id: post.id, group_id: group.id, product_id: product.id, error_message: err.message },
          { user_id, source: 'telegram-sender' }
        ));
      } else {
        // Throw para BullMQ fazer retry
        throw err;
      }
    }
  },
  {
    connection: redisConnection,
  }
);

telegramWorker.on('failed', (job, err) => {
  console.error(`[Worker: Telegram] Job ${job?.id} falhou:`, err);
  
  if (job?.data?.user_id) {
    eventBus.emit(new WorkerFailedEvent(
      { worker_name: 'telegram-sender', job_id: job.id || 'unknown', error_message: err.message },
      { user_id: job.data.user_id, source: 'telegram-worker-events' }
    ));
  }
});
