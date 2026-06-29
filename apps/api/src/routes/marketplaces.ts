import { FastifyInstance } from 'fastify';
import { requireAuth, getClientIp, getUserAgent } from '../middleware/auth.middleware';
import { connectionRepository } from '../repositories';
import { auditService } from '../services';
import { encryptSecret } from '../lib/crypto';
import { validateBody, marketplaceConfigSchema, marketplaceTestSchema } from '../validators';

/**
 * Rotas de Marketplaces — Refatoradas para usar:
 * - Middleware centralizado
 * - Validators Zod
 * - ConnectionRepository
 * - AuditService
 */
export async function marketplaceRoutes(fastify: FastifyInstance) {

  // ============================
  // 1. Obter Status (sem expor App Secret)
  // ============================
  fastify.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: connections, error } = await connectionRepository.findAllByUser(user.id);

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch statuses' });
    }

    const statuses = connections.map(c => {
      const isConnected = c.status === 'connected';
      let maskedAffiliate: string | undefined = undefined;

      if (c.metadata?.affiliate_id) {
        const affId = c.metadata.affiliate_id;
        maskedAffiliate = affId.length > 4
          ? affId.substring(0, 2) + '***' + affId.substring(affId.length - 2)
          : '***';
      }

      return {
        platform: c.platform,
        connected: isConnected,
        status: c.status,
        updated_at: c.updated_at,
        metadata: {
          app_id: c.metadata?.app_id || c.metadata?.client_id || null,
          affiliate_id: maskedAffiliate,
        },
      };
    });

    return { statuses };
  });

  // ============================
  // 2. Salvar Configurações (Criptografado)
  // ============================
  fastify.post('/config', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(marketplaceConfigSchema, request.body);

    // Criptografar segredo antes de salvar
    const encryptedSecret = body.app_secret ? encryptSecret(body.app_secret) : null;

    const metadata = {
      app_id: body.app_id,
      app_secret: encryptedSecret,
      affiliate_id: body.affiliate_id,
    };

    const { error } = await connectionRepository.upsert(user.id, body.platform, {
      status: 'connected',
      metadata,
      access_token: null, // Apenas se houver fluxo OAuth
    });

    if (error) {
      return reply.code(500).send({ error: 'Falha ao salvar configurações' });
    }

    // Auditoria (sem expor secret nos logs)
    await auditService.log({
      userId: user.id,
      action: 'marketplace_configured',
      entity: 'platform_connections',
      message: `Configurações da ${body.platform} salvas com sucesso.`,
      metadata: { platform: body.platform, has_app_id: !!body.app_id, has_affiliate: !!body.affiliate_id },
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true };
  });

  // ============================
  // 3. Testar Conexão
  // ============================
  fastify.post('/test', { preHandler: requireAuth }, async (request, reply) => {
    const body = validateBody(marketplaceTestSchema, request.body);

    // Implementação futura: chamada real à API da Shopee ou Meli.
    return {
      status: 'configured_pending_validation',
      message: 'Configurações salvas. Faça uma busca para testar na prática.',
    };
  });
}
