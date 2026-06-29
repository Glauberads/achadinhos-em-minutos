import { FastifyInstance } from 'fastify';
import { requireAuth, getClientIp, getUserAgent } from '../middleware/auth.middleware';
import { campaignRepository } from '../repositories';
import { auditService } from '../services';
import { supabaseAdmin } from '../lib/supabase';
import {
  validateBody,
  validateParams,
  campaignCreateSchema,
  campaignUpdateSchema,
  idParamSchema,
} from '../validators';

/**
 * Rotas de Campanhas — Refatoradas para usar:
 * - Middleware centralizado
 * - Validators Zod
 * - CampaignRepository
 * - AuditService
 */
export async function campaignRoutes(fastify: FastifyInstance) {

  // ============================
  // 1. Criar Campanha
  // ============================
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(campaignCreateSchema, request.body);

    const { data: campaign, error } = await campaignRepository.create({
      user_id: user.id,
      name: body.name,
      platform: body.platform,
      keyword: body.keyword,
      category: body.category,
      filters: body.filters,
      telegram_group_id: body.telegram_group_id,
      recurrence_cron: body.recurrence_cron,
      next_run_at: new Date().toISOString(),
      status: 'active',
    });

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Falha ao criar campanha' });
    }

    await auditService.log({
      userId: user.id,
      action: 'campaign_created',
      entity: 'campaigns',
      entityId: campaign.id,
      message: `Campanha '${body.name}' criada.`,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, campaign };
  });

  // ============================
  // 2. Listar Campanhas
  // ============================
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: campaigns, error } = await campaignRepository.findByUser(user.id);

    if (error) {
      return reply.code(500).send({ error: 'Falha ao listar campanhas' });
    }

    return { campaigns };
  });

  // ============================
  // 3. Atualizar Campanha
  // ============================
  fastify.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = validateParams(idParamSchema, request.params);
    const body = validateBody(campaignUpdateSchema, request.body);

    const { data: campaign, error } = await campaignRepository.update(id, user.id, body);

    if (error) {
      return reply.code(500).send({ error: 'Falha ao atualizar campanha' });
    }

    await auditService.log({
      userId: user.id,
      action: 'campaign_updated',
      entity: 'campaigns',
      entityId: id,
      message: `Campanha atualizada.`,
      metadata: { changes: body },
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, campaign };
  });

  // ============================
  // 4. Pausar Campanha
  // ============================
  fastify.post('/:id/pause', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = validateParams(idParamSchema, request.params);

    await campaignRepository.updateStatus(id, user.id, 'paused');

    await auditService.log({
      userId: user.id,
      action: 'campaign_paused',
      entity: 'campaigns',
      entityId: id,
      message: `Campanha pausada.`,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, status: 'paused' };
  });

  // ============================
  // 5. Retomar Campanha
  // ============================
  fastify.post('/:id/resume', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = validateParams(idParamSchema, request.params);

    await campaignRepository.updateStatus(id, user.id, 'active', {
      next_run_at: new Date().toISOString(),
    });

    await auditService.log({
      userId: user.id,
      action: 'campaign_resumed',
      entity: 'campaigns',
      entityId: id,
      message: `Campanha retomada.`,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, status: 'active' };
  });

  // ============================
  // 6. Rodar Agora
  // ============================
  fastify.post('/:id/run-now', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = validateParams(idParamSchema, request.params);

    await campaignRepository.update(id, user.id, {
      next_run_at: new Date().toISOString(),
    });

    await auditService.log({
      userId: user.id,
      action: 'campaign_run_now',
      entity: 'campaigns',
      entityId: id,
      message: `Execução imediata solicitada.`,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, message: 'Campanha colocada na fila de execução imediata.' };
  });

  // ============================
  // 7. Listar Logs da Campanha (Scheduled Posts recentes)
  // ============================
  fastify.get('/:id/logs', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = validateParams(idParamSchema, request.params);

    const { data: logs, error } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*, product:products(title, current_price, image_url)')
      .eq('campaign_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return reply.code(500).send({ error: 'Falha ao buscar logs da campanha' });
    }

    return { logs };
  });
}
