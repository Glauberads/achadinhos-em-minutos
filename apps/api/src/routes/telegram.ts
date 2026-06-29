import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { requireAuth, getClientIp, getUserAgent } from '../middleware/auth.middleware';
import { connectionRepository, groupRepository, productRepository } from '../repositories';
import { telegramService, auditService } from '../services';
import { validateBody, telegramConnectSchema, telegramTestSendSchema } from '../validators';

/**
 * Rotas do Telegram — Refatoradas para usar:
 * - Middleware centralizado (requireAuth)
 * - Validators Zod
 * - Repositories (ConnectionRepository, GroupRepository, ProductRepository)
 * - Services (TelegramService, AuditService)
 * 
 * Nenhuma query direta ao Supabase — tudo via camada de abstração.
 * Nenhuma lógica de negócio — tudo delegado aos Services.
 */
export const telegramRoutes: FastifyPluginAsync = async (fastify, opts) => {

  // ============================
  // 1. Conectar / Atualizar Token do Telegram
  // ============================
  fastify.post('/connect', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(telegramConnectSchema, request.body);

    try {
      // 1. Validar token na Telegram API
      const validation = await telegramService.validateBotToken(body.bot_token);
      if (!validation.valid) {
        return reply.status(400).send({ error: 'Token do bot inválido', details: validation.error });
      }

      // 2. Salvar/atualizar na platform_connections
      const { error: connError } = await connectionRepository.upsert(user.id, 'telegram', {
        access_token: body.bot_token,
        status: 'connected',
        metadata: { bot_username: validation.username },
      });
      if (connError) throw connError;

      // 3. Salvar grupo
      const { error: groupError } = await groupRepository.create({
        user_id: user.id,
        platform: 'telegram',
        group_name: body.group_name,
        external_group_id: body.chat_id,
        is_active: true,
      });
      if (groupError) throw groupError;

      // 4. Auditoria
      await auditService.log({
        userId: user.id,
        action: 'telegram_connected',
        entity: 'platform_connections',
        message: `Bot ${validation.username} conectado com sucesso.`,
        ip: getClientIp(request),
        userAgent: getUserAgent(request),
      });

      return reply.send({ success: true, bot_username: validation.username });

    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro interno ao conectar telegram', details: err.message });
    }
  });

  // ============================
  // 2. Status da Conexão (sem expor token)
  // ============================
  fastify.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: conn } = await connectionRepository.findByPlatform(user.id, 'telegram');
    const groupsCount = await groupRepository.countActiveByUser(user.id);

    if (!conn) {
      return reply.send({ connected: false, groups_count: 0 });
    }

    return reply.send({
      connected: conn.status === 'connected',
      bot_username: conn.metadata?.bot_username,
      groups_count: groupsCount,
    });
  });

  // ============================
  // 3. Envio de Teste
  // ============================
  fastify.post('/test-send', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(telegramTestSendSchema, request.body);

    try {
      // 1. Buscar token do bot
      const botToken = await telegramService.getBotToken(user.id);
      if (!botToken) {
        return reply.status(400).send({ error: 'Nenhuma conexão do Telegram encontrada para este usuário.' });
      }

      // 2. Buscar produto
      const product = await productRepository.findById(body.product_id, user.id);
      if (!product) {
        return reply.status(404).send({ error: 'Produto não encontrado ou não pertence a você.' });
      }

      // 3. Buscar grupo
      const { data: group } = await groupRepository.findById(body.group_id, user.id);
      if (!group) {
        return reply.status(404).send({ error: 'Grupo não encontrado.' });
      }

      // 4. Construir e enviar mensagem
      const caption = telegramService.buildOfferMessage(product, false);
      const result = await telegramService.sendMessage({
        botToken,
        chatId: group.external_group_id,
        caption,
        imageUrl: product.image_url,
      });

      // 5. Registrar log
      const status = result.ok ? 'success' : 'failed';
      await telegramService.logSendResult({
        userId: user.id,
        productId: product.id,
        groupId: group.id,
        status,
        errorMessage: result.ok ? null : result.description,
      });

      // 6. Auditoria
      await auditService.log({
        userId: user.id,
        action: result.ok ? 'telegram_test_sent' : 'telegram_test_failed',
        entity: 'send_logs',
        entityId: product.id,
        message: result.ok ? 'Teste enviado com sucesso' : `Falha: ${result.description}`,
        ip: getClientIp(request),
        userAgent: getUserAgent(request),
      });

      if (!result.ok) {
        return reply.status(500).send({ error: 'Erro no envio do Telegram', details: result.description });
      }

      return reply.send({ success: true, message: 'Teste enviado com sucesso!' });

    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro interno ao processar envio', details: err.message });
    }
  });
};
