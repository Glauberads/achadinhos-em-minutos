import { FastifyInstance } from 'fastify';
import { creativeStudioService } from '../services/creative-studio.service';
import { generateCreativeSchema, updateCreativeSchema, GenerateCreativeDTO, UpdateCreativeDTO } from '../validators/creative.validator';
import { featureFlagService } from '../services/feature-flag.service';
import { eventBus, FeatureDisabledEvent, CreativeSavedEvent } from '../events';
import { requireAuth } from '../middleware/auth.middleware';
import { generateImageCreativeSchema } from '../services/image-creative.validator';
import { imageCreativeService } from '../services/image-creative.service';
import { productLinkParserService } from '../services/product-link-parser.service';
import { z } from 'zod';

export async function creativeRoutes(server: FastifyInstance) {
  
  const requireCreativeAccess = async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    try {
      const isEnabled = await featureFlagService.isEnabled('creative_studio_ai', { userId: request.user?.id });
      if (!isEnabled) {
        eventBus.emit(new FeatureDisabledEvent({ feature_key: 'creative_studio_ai' }, { user_id: request.user?.id, source: 'API' }));
        return reply.status(403).send({ error: 'Módulo Creative Studio AI indisponível no seu plano ou temporariamente desativado.' });
      }
    } catch (err) {
      console.warn('[creativeRoutes] Feature flag check failed, allowing by default');
    }
  };

  server.post('/analyze-link', {
    preHandler: [requireCreativeAccess],
  }, async (request, reply) => {
    try {
      const schema = z.object({ url: z.string().url() });
      const result = schema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'URL inválida.' });
      }

      // TODO: Implement cache using Redis if it was already parsed recently
      const product = await productLinkParserService.parseAndFetch(result.data.url);
      
      // Simulate cache hit flag for UI preview
      return reply.send({ success: true, product, cached: false });
    } catch (err: any) {
      console.error('[creatives/analyze-link] Error:', err);
      return reply.status(500).send({ error: 'Erro ao analisar produto silenciosamente.' });
    }
  });

  server.post<{ Body: GenerateCreativeDTO }>('/generate-from-link', {
    preHandler: [requireCreativeAccess],
  }, async (request, reply) => {
    try {
      const result = generateCreativeSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: result.error.errors[0].message });
      }

      const { product_url, style } = result.data;
      const response = await creativeStudioService.generateFromLink(product_url, style || 'Oferta Relâmpago', request.user.id);
      return reply.status(202).send(response);
    } catch (err: any) {
      console.error('[creatives/generate-from-link] Error:', err);
      return reply.status(500).send({ error: 'Erro ao gerar vídeo.' });
    }
  });

  server.post('/generate-image-from-link', {
    preHandler: [requireCreativeAccess],
  }, async (request, reply) => {
    try {
      const result = generateImageCreativeSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: result.error.errors[0].message });
      }

      const { product_url, format, style } = result.data;
      const creative = await imageCreativeService.generateFromLink(product_url, format, style, request.user.id);
      
      return reply.status(201).send({ success: true, creative });
    } catch (err: any) {
      console.error('[creatives/generate-image-from-link] Error:', err);
      return reply.status(500).send({ error: 'Erro ao gerar imagem.' });
    }
  });

  server.get<{ Querystring: { url: string } }>('/proxy-image', async (request, reply) => {
    try {
      const imageUrl = request.query.url;
      if (!imageUrl) {
        return reply.status(400).send({ error: 'URL is required' });
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        return reply.status(400).send({ error: 'Failed to fetch image' });
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Content-Type', contentType);
      reply.header('Cache-Control', 'public, max-age=31536000');
      
      return reply.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error('[creatives/proxy-image] Error:', err.message);
      return reply.status(500).send({ error: 'Failed to proxy image' });
    }
  });

  server.get('/', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const creatives = await creativeStudioService.getCreatives(request.user.id);
      return reply.send({ creatives });
    } catch (err: any) {
      console.error('[creatives/GET] Error:', err);
      return reply.status(500).send({ error: 'Erro ao buscar criativos.' });
    }
  });

  server.get<{ Params: { id: string } }>('/:id', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const creative = await creativeStudioService.getCreative(request.params.id, request.user.id);
      if (!creative) return reply.status(404).send({ error: 'Criativo não encontrado' });
      return reply.send({ creative });
    } catch (err: any) {
      console.error('[creatives/GET_ID] Error:', err);
      return reply.status(500).send({ error: 'Erro ao buscar criativo.' });
    }
  });

  server.patch<{ Params: { id: string }, Body: UpdateCreativeDTO }>('/:id', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const result = updateCreativeSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ error: 'Dados inválidos' });
      }

      const creative = await creativeStudioService.updateCreative(request.params.id, request.user.id, result.data);
      return reply.send({ creative });
    } catch (err: any) {
      console.error('[creatives/PATCH] Error:', err);
      return reply.status(500).send({ error: 'Erro ao atualizar criativo.' });
    }
  });

  server.delete<{ Params: { id: string } }>('/:id', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      await creativeStudioService.deleteCreative(request.params.id, request.user.id);
      return reply.status(204).send();
    } catch (err: any) {
      console.error('[creatives/DELETE] Error:', err);
      return reply.status(500).send({ error: 'Erro ao excluir criativo.' });
    }
  });

  server.post<{ Params: { id: string } }>('/:id/render', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const response = await creativeStudioService.triggerRender(request.params.id, request.user.id);
      return reply.status(202).send(response);
    } catch (err: any) {
      console.error('[creatives/render] Error:', err);
      return reply.status(500).send({ error: 'Erro ao iniciar renderização.' });
    }
  });

  server.post<{ Params: { id: string } }>('/:id/upload-image', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'Nenhuma imagem enviada.' });
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.' });
      }

      const buffer = await data.toBuffer();
      const response = await creativeStudioService.uploadProductImage(request.params.id, request.user.id, buffer, data.mimetype);
      return reply.status(200).send(response);
    } catch (err: any) {
      console.error('[creatives/upload-image] Error:', err);
      if (err instanceof request.server.multipartErrors.FilesLimitError) {
        return reply.status(400).send({ error: 'O arquivo excede o limite de 5MB.' });
      }
      return reply.status(500).send({ error: 'Erro ao fazer upload da imagem.' });
    }
  });

  server.post<{ Params: { id: string } }>('/:id/accept-fallback', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const response = await creativeStudioService.acceptFallbackImage(request.params.id, request.user.id);
      return reply.status(200).send(response);
    } catch (err: any) {
      console.error('[creatives/accept-fallback] Error:', err);
      return reply.status(500).send({ error: 'Erro ao aceitar imagem genérica.' });
    }
  });


  server.post<{ Params: { id: string } }>('/:id/send-test', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      eventBus.emit(new CreativeSavedEvent({ creative_id: request.params.id }, { user_id: request.user.id, source: 'API' }));
      return reply.send({ success: true, message: 'Teste enviado com sucesso' });
    } catch (err: any) {
      console.error('[creatives/send-test] Error:', err);
      return reply.status(500).send({ error: 'Erro ao enviar teste.' });
    }
  });

  server.post<{ Params: { id: string } }>('/:id/select-version', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      await creativeStudioService.updateCreative(id, userId, { generation_status: 'draft_selected' });
      return reply.send({ success: true, message: 'Versão selecionada com sucesso.' });
    } catch (err: any) {
      console.error('[creatives/select-version] Error:', err);
      return reply.status(500).send({ error: 'Erro ao selecionar versão.' });
    }
  });

  server.post('/analytics', { preHandler: [requireCreativeAccess] }, async (request, reply) => {
    try {
      const { learningEngineService } = await import('../services/learning-engine.service');
      const payload = request.body as any;
      await learningEngineService.registerMetrics({ ...payload, user_id: request.user.id });
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('[creatives/analytics] Error:', err);
      return reply.status(500).send({ error: 'Erro ao registrar métricas.' });
    }
  });
}
