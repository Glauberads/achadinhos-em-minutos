import { FastifyInstance } from 'fastify';
import { creativeStudioService } from '../services/creative-studio.service';
import { generateCreativeSchema, updateCreativeSchema, GenerateCreativeDTO, UpdateCreativeDTO } from '../validators/creative.validator';
import { featureFlagService } from '../services/feature-flag.service';
import { eventBus, FeatureDisabledEvent, CreativeSavedEvent } from '../events';

export async function creativeRoutes(server: FastifyInstance) {
  
  // Middleware para verificar a Feature Flag em todas as rotas
  server.addHook('onRequest', async (request, reply) => {
    const isEnabled = await featureFlagService.isEnabled('creative_studio_ai', { userId: request.user?.id });
    if (!isEnabled) {
      eventBus.emit(new FeatureDisabledEvent({ feature_key: 'creative_studio_ai' }, { user_id: request.user?.id, source: 'API' }));
      return reply.status(403).send({ error: 'Módulo Creative Studio AI indisponível no seu plano ou temporariamente desativado.' });
    }
  });

  server.post<{ Body: GenerateCreativeDTO }>('/generate-from-link', {
    schema: {
      body: {
        type: 'object',
        required: ['product_url'],
        properties: {
          product_url: { type: 'string' },
          style: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Validação com Zod
    const result = generateCreativeSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: result.error.errors[0].message });
    }

    const { product_url, style } = result.data;
    const response = await creativeStudioService.generateFromLink(product_url, style || 'Oferta Relâmpago', request.user.id);
    return reply.status(202).send(response);
  });

  server.get('/', async (request, reply) => {
    const creatives = await creativeStudioService.getCreatives(request.user.id);
    return reply.send({ creatives });
  });

  server.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const creative = await creativeStudioService.getCreative(request.params.id, request.user.id);
    if (!creative) return reply.status(404).send({ error: 'Criativo não encontrado' });
    return reply.send({ creative });
  });

  server.patch<{ Params: { id: string }, Body: UpdateCreativeDTO }>('/:id', async (request, reply) => {
    const result = updateCreativeSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados inválidos' });
    }

    const creative = await creativeStudioService.updateCreative(request.params.id, request.user.id, result.data);
    return reply.send({ creative });
  });

  server.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await creativeStudioService.deleteCreative(request.params.id, request.user.id);
    return reply.status(204).send();
  });

  server.post<{ Params: { id: string } }>('/:id/render', async (request, reply) => {
    const response = await creativeStudioService.triggerRender(request.params.id, request.user.id);
    return reply.status(202).send(response);
  });

  server.post<{ Params: { id: string } }>('/:id/send-test', async (request, reply) => {
    // Mock do envio de teste
    eventBus.emit(new CreativeSavedEvent({ creative_id: request.params.id }, { user_id: request.user.id, source: 'API' }));
    return reply.send({ success: true, message: 'Teste enviado com sucesso' });
  });

  server.post<{ Params: { id: string } }>('/:id/select-version', async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.id;
    // Marca este como draft final para ir pro Storyboard Editor e eventualmente Render
    await creativeStudioService.updateCreative(id, userId, { generation_status: 'draft_selected' });
    return reply.send({ success: true, message: 'Versão selecionada com sucesso.' });
  });

  server.post('/analytics', async (request, reply) => {
    const { learningEngineService } = await import('../services/learning-engine.service');
    const payload = request.body as any;
    
    await learningEngineService.registerMetrics({
      ...payload,
      user_id: request.user.id
    });

    return reply.send({ success: true });
  });
}
