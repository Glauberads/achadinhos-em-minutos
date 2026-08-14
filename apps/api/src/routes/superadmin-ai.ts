import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.middleware';
import { requireSuperadmin } from '../middleware/require-superadmin';
import { supabaseAdmin } from '../lib/supabase';
import { aiGovernanceRepository } from '../repositories/ai-governance.repository';
import { 
  AIProviderCreateSchema, 
  AIProviderUpdateSchema,
  AIProviderModelCreateSchema,
  AIProviderModelUpdateSchema,
  AIProviderCredentialWriteSchema,
  AICapabilityRouteUpsertSchema
} from '@achadinhos/shared';

export async function superadminAIRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de Superadmin em todas as rotas deste plugin
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireSuperadmin);

  // ==========================================
  // Providers
  // ==========================================
  fastify.get('/providers', async (request, reply) => {
    try {
      const providers = await aiGovernanceRepository.getProviders();
      return reply.send(providers);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.get('/providers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const provider = await aiGovernanceRepository.getProviderById(id);
      if (!provider) return reply.status(404).send({ error: 'Provider not found' });
      return reply.send(provider);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.post('/providers', async (request, reply) => {
    const parsed = AIProviderCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_providers')
        .insert({
          provider_type: parsed.data.providerType,
          display_name: parsed.data.displayName,
          enabled: parsed.data.enabled,
          status: parsed.data.status
        })
        .select()
        .single();
        
      if (error) throw error;
      return reply.status(201).send(data);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.patch('/providers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = AIProviderUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_providers')
        .update({
          display_name: parsed.data.displayName,
          enabled: parsed.data.enabled,
          status: parsed.data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return reply.send(data);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.delete('/providers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const { error } = await supabaseAdmin.from('ai_providers').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') { // foreign_key_violation
          return reply.status(409).send({ error: 'Conflict: Provider is being used in routes or has models.' });
        }
        throw error;
      }
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ==========================================
  // Credentials
  // ==========================================
  fastify.post('/credentials', async (request, reply) => {
    const parsed = AIProviderCredentialWriteSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      await aiGovernanceRepository.upsertCredential(parsed.data.providerId, parsed.data.apiKey);
      return reply.send({ success: true, message: 'Credential saved securely.' });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ==========================================
  // Models
  // ==========================================
  fastify.get('/models', async (request, reply) => {
    const query = request.query as { providerId?: string };
    try {
      const models = await aiGovernanceRepository.getModels(query.providerId);
      return reply.send(models);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.post('/models', async (request, reply) => {
    const parsed = AIProviderModelCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_provider_models')
        .insert({
          provider_id: parsed.data.providerId,
          model_key: parsed.data.modelKey,
          display_name: parsed.data.displayName,
          capabilities: parsed.data.capabilities,
          enabled: parsed.data.enabled
        })
        .select()
        .single();
        
      if (error) throw error;
      return reply.status(201).send(data);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.patch('/models/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = AIProviderModelUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_provider_models')
        .update({
          model_key: parsed.data.modelKey,
          display_name: parsed.data.displayName,
          capabilities: parsed.data.capabilities,
          enabled: parsed.data.enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return reply.send(data);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.delete('/models/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const { error } = await supabaseAdmin.from('ai_provider_models').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') return reply.status(409).send({ error: 'Conflict: Model is used in active routes.' });
        throw error;
      }
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // ==========================================
  // Routes
  // ==========================================
  fastify.get('/routes', async (request, reply) => {
    try {
      const routes = await aiGovernanceRepository.getRoutes();
      return reply.send(routes);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  fastify.put('/routes', async (request, reply) => {
    const parsed = AICapabilityRouteUpsertSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_capability_routes')
        .upsert({
          capability: parsed.data.capability,
          primary_provider_id: parsed.data.primaryProviderId,
          primary_model_id: parsed.data.primaryModelId,
          fallback_provider_id: parsed.data.fallbackProviderId || null,
          fallback_model_id: parsed.data.fallbackModelId || null,
          enabled: parsed.data.enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'capability' })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23503') return reply.status(400).send({ error: 'Validation failed: Provider or Model ID not found.' });
        throw error;
      }
      return reply.send(data);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
