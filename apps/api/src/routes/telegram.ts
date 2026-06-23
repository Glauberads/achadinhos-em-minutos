import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';

// Middleware simulado como um hook do fastify para verificar JWT via header
export const requireAuth = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token JWT não fornecido ou inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  // Usamos getUser para validar o token diretamente com o Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    reply.status(401).send({ error: 'Não autorizado', details: error?.message });
    return;
  }

  // Pendura o usuário na request para uso nas rotas
  request.user = user;
};

export const telegramRoutes: FastifyPluginAsync = async (fastify, opts) => {
  
  // Decorar request (opcional para TS, mas útil)
  fastify.decorateRequest('user', null);

  // 1. Conectar / Atualizar Token do Telegram
  fastify.post('/connect', { preHandler: requireAuth }, async (request, reply) => {
    const { bot_token, chat_id, group_name } = request.body as any;
    const user = request.user;

    if (!bot_token || !chat_id) {
      return reply.status(400).send({ error: 'bot_token e chat_id são obrigatórios' });
    }

    // 1. Validar o token na Telegram API chamando getMe
    try {
      const tgResponse = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
      const tgData = await tgResponse.json();

      if (!tgData.ok) {
        return reply.status(400).send({ error: 'Token do bot inválido', details: tgData.description });
      }

      const botUsername = tgData.result.username;

      // 2. Salvar na platform_connections (criptografia omitida para MVP rápido, mas essencial em prod)
      const { data: existingConn } = await supabaseAdmin
        .from('platform_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'telegram')
        .single();

      if (existingConn) {
        const { error: updateError } = await supabaseAdmin
          .from('platform_connections')
          .update({
            access_token: bot_token, // TODO: Criptografar antes de salvar
            status: 'connected',
            metadata: { bot_username: botUsername }
          })
          .eq('id', existingConn.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('platform_connections')
          .insert({
            user_id: user.id,
            platform: 'telegram',
            access_token: bot_token,
            status: 'connected',
            metadata: { bot_username: botUsername }
          });
        if (insertError) throw insertError;
      }

      // 3. Salvar o grupo principal
      const { error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          user_id: user.id,
          platform: 'telegram',
          group_name: group_name || 'Meu Canal',
          external_group_id: chat_id,
          is_active: true
        });

      if (groupError) throw groupError;

      // 4. Salvar log de sistema
      await supabaseAdmin.from('system_logs').insert({
        user_id: user.id,
        action: 'telegram_connected',
        entity: 'platform_connections',
        message: `Bot ${botUsername} conectado com sucesso.`
      });

      return reply.send({ success: true, bot_username: botUsername });

    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro interno ao conectar telegram', details: err.message });
    }
  });

  // 2. Obter Status da Conexão (Seguro, sem expor token)
  fastify.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: conn } = await supabaseAdmin
      .from('platform_connections')
      .select('status, metadata')
      .eq('user_id', user.id)
      .eq('platform', 'telegram')
      .single();

    const { count: groupsCount } = await supabaseAdmin
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('platform', 'telegram')
      .eq('is_active', true);

    if (!conn) {
      return reply.send({ connected: false, groups_count: 0 });
    }

    return reply.send({
      connected: conn.status === 'connected',
      bot_username: conn.metadata?.bot_username,
      groups_count: groupsCount || 0
    });
  });

  // 3. Envio de Teste
  fastify.post('/test-send', { preHandler: requireAuth }, async (request, reply) => {
    const { product_id, group_id } = request.body as any;
    const user = request.user;

    try {
      // 1. Buscar conexão do Telegram
      const { data: conn } = await supabaseAdmin
        .from('platform_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('platform', 'telegram')
        .single();

      if (!conn || !conn.access_token) {
        return reply.status(400).send({ error: 'Nenhuma conexão do Telegram encontrada para este usuário.' });
      }

      // 2. Buscar Produto
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('user_id', user.id)
        .single();

      if (!product) return reply.status(404).send({ error: 'Produto não encontrado ou não pertence a você.' });

      // 3. Buscar Grupo
      const { data: group } = await supabaseAdmin
        .from('groups')
        .select('external_group_id')
        .eq('id', group_id)
        .eq('user_id', user.id)
        .single();

      if (!group) return reply.status(404).send({ error: 'Grupo não encontrado.' });

      // 4. Montar Mensagem
      const truncTitle = product.title.length > 80 ? product.title.substring(0, 80) + '...' : product.title;
      
      let caption = `🔥 *Achadinho em Minutos*\n\n`;
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
      
      caption += `✅ Produto em alta\n`;
      if (product.free_shipping) {
        caption += `✅ Frete grátis\n`;
      }
      caption += `✅ Link seguro de afiliado\n\n`;
      
      const link = product.affiliate_link || product.source_url;
      caption += `👉 *Comprar agora:*\n[Acessar Oferta](${link})`;

      // 5. Enviar para Telegram API
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

      // 6. Registrar logs
      const logStatus = tgResult.ok ? 'success' : 'failed';
      const logError = tgResult.ok ? null : tgResult.description;

      await supabaseAdmin.from('send_logs').insert({
        user_id: user.id,
        product_id: product.id,
        group_id: group.id,
        status: logStatus,
        error_message: logError
      });

      if (!tgResult.ok) {
        return reply.status(500).send({ error: 'Erro no envio do Telegram', details: tgResult.description });
      }

      return reply.send({ success: true, message: 'Teste enviado com sucesso!' });

    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro interno ao processar envio', details: err.message });
    }
  });
};
