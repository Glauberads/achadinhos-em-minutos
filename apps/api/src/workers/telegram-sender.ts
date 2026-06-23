import { Worker, UnrecoverableError } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { supabaseAdmin } from '../lib/supabase';

const TELEGRAM_SEND_INTERVAL_SECONDS = parseInt(process.env.TELEGRAM_SEND_INTERVAL_SECONDS || '30');

// Separamos o builder da mensagem por boa prática (regra 8 do usuário)
function buildTelegramOfferMessage(product: any): string {
  const truncTitle = product.title.length > 80 ? product.title.substring(0, 80) + '...' : product.title;
  let caption = `🔥 *Achadinho Automático*\n\n`;
  caption += `${truncTitle}\n\n`;
  if (product.original_price > product.current_price) {
    caption += `De: R$ ${product.original_price}\n`;
  }
  caption += `Por: *R$ ${product.current_price}*\n`;
  if (product.discount) {
    caption += `Desconto: ${product.discount}%\n\n`;
  } else {
    caption += `\n`;
  }
  
  if (product.sold_count > 100) caption += `✅ Mais de ${product.sold_count} vendidos\n`;
  if (product.free_shipping) caption += `✅ Frete grátis garantido\n`;
  caption += `✅ Link seguro de parceiro\n\n`;
  
  const link = product.affiliate_link; // Já garantimos que existe
  caption += `👉 *COMPRE COM DESCONTO:*\n[Acessar Oferta Aqui](${link})`;
  return caption;
}

export const telegramWorker = new Worker(
  'telegram-send',
  async (job) => {
    const { scheduledPostId } = job.data;
    console.log(`[Telegram Sender] Processando post ${scheduledPostId}`);

    // 1. Buscar Scheduled Post + Produto + Grupo
    const { data: post, error: postError } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, product:products(*), group:groups(*)')
      .eq('id', scheduledPostId)
      .single();

    if (postError || !post) {
      console.error(`[Telegram Sender] Post não encontrado: ${scheduledPostId}`);
      return; // Morre quieto
    }

    if (post.status === 'sent' || post.status === 'failed') {
      console.log(`[Telegram Sender] Post já processado anteriormente. Ignorando.`);
      return;
    }

    const { product, group, user_id } = post;

    // 2. Validação Restrita do Affiliate Link
    if (!product.affiliate_link) {
      await supabaseAdmin.from('scheduled_posts').update({
        status: 'failed',
        error_message: 'missing_affiliate_link'
      }).eq('id', post.id);

      await supabaseAdmin.from('system_logs').insert({
        user_id,
        action: 'telegram_failed',
        entity: 'scheduled_posts',
        message: `Envio cancelado. Produto ${product.id} sem link de afiliado.`
      });
      return; // Falhou, mas não joga o erro para a fila pra não travar retry
    }

    // 3. Aplicar Rate Limit no Redis pelo Group ID
    const lockKey = `lock:telegram:${group.id}`;
    const acquired = await redisConnection.set(lockKey, '1', 'NX', 'EX', TELEGRAM_SEND_INTERVAL_SECONDS);
    if (!acquired) {
      console.log(`[Telegram Sender] Rate Limit atingido para o grupo ${group.id}. Atrasando envio.`);
      // O throw fará o BullMQ colocar em retry (backoff)
      throw new Error(`Rate limit active for group ${group.id}`);
    }

    try {
      // 4. Buscar Credenciais
      const { data: conn } = await supabaseAdmin
        .from('platform_connections')
        .select('access_token')
        .eq('user_id', user_id)
        .eq('platform', 'telegram')
        .eq('status', 'connected')
        .single();

      if (!conn || !conn.access_token) {
        throw new UnrecoverableError('Credenciais do Telegram ausentes ou desconectadas.');
      }

      // 5. Construir e Enviar
      const caption = buildTelegramOfferMessage(product);
      
      let tgEndpoint = 'sendMessage';
      let payload: any = {
        chat_id: group.external_group_id,
        parse_mode: 'Markdown',
      };

      if (product.image_url) {
        tgEndpoint = 'sendPhoto';
        payload.photo = product.image_url;
        payload.caption = caption;
      } else {
        payload.text = caption;
      }

      const tgResponse = await fetch(`https://api.telegram.org/bot${conn.access_token}/${tgEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const tgResult = await tgResponse.json();

      if (!tgResult.ok) {
        // Se for erro de grupo banido ou bot mutado, pode ser fatal.
        throw new Error(`Telegram API Error: ${tgResult.description}`);
      }

      // 6. Sucesso: Atualizar estado
      await supabaseAdmin.from('scheduled_posts').update({
        status: 'sent',
        sent_at: new Date().toISOString()
      }).eq('id', post.id);

      await supabaseAdmin.from('send_logs').insert({
        user_id,
        product_id: product.id,
        group_id: group.id,
        status: 'success'
      });

      console.log(`[Telegram Sender] Post ${post.id} enviado com sucesso!`);

    } catch (err: any) {
      console.error(`[Telegram Sender] Erro ao enviar post ${post.id}:`, err.message);

      if (err instanceof UnrecoverableError || err.message.includes('Credenciais')) {
        // Marca como failed se não pudermos recuperar
        await supabaseAdmin.from('scheduled_posts').update({
          status: 'failed',
          error_message: err.message
        }).eq('id', post.id);
      } else {
        // Apenas dá throw para o BullMQ fazer o retry
        throw err;
      }
    }
  },
  { 
    connection: redisConnection,
    concurrency: 1, // Impede que 2 workers enviem pro telegram ao mesmo tempo
    settings: {
      backoffStrategies: {} // Config default do BullMQ já tem backoff se usar attempts > 1
    }
  }
);

telegramWorker.on('failed', (job, err) => {
  console.error(`[Worker: Telegram] Job ${job?.id} falhou:`, err);
});
