import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';
import { encryptSecret } from '../lib/crypto';

// Reusa a função do telegram.ts por praticidade, ou pode ser movida para um middleware comum
const requireAuth = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token JWT não fornecido ou inválido' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    reply.status(401).send({ error: 'Não autorizado', details: error?.message });
    return;
  }
  request.user = user;
};

export async function marketplaceRoutes(fastify: FastifyInstance) {
  fastify.decorateRequest('user', null);

  // 1. Obter Status (Seguro, sem expor App Secret)
  fastify.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: connections, error } = await supabaseAdmin
      .from('platform_connections')
      .select('platform, status, metadata, updated_at')
      .eq('user_id', user.id);

    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch statuses' });
    }

    const statuses = connections.map(c => {
      const isConnected = c.status === 'connected';
      let maskedAffiliate = undefined;
      
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
          app_id: c.metadata?.app_id || c.metadata?.client_id || null, // App ID pode ser exposto
          affiliate_id: maskedAffiliate
        }
      };
    });

    return { statuses };
  });

  // 2. Salvar Configurações (Criptografado)
  fastify.post('/config', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { platform, app_id, app_secret, affiliate_id } = request.body as any;

    if (!['shopee', 'mercadolivre'].includes(platform)) {
      return reply.code(400).send({ error: 'Plataforma inválida' });
    }

    // Criptografar segredo
    const encryptedSecret = app_secret ? encryptSecret(app_secret) : null;

    const metadata = {
      app_id,
      app_secret: encryptedSecret,
      affiliate_id
    };

    // Upsert seguro
    const { data: existing } = await supabaseAdmin
      .from('platform_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('platform_connections')
        .update({
          status: 'connected',
          metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('platform_connections')
        .insert({
          user_id: user.id,
          platform,
          status: 'connected',
          metadata,
          access_token: null // Apenas se houver fluxo OAuth
        });
    }

    // Log de sistema
    await supabaseAdmin.from('system_logs').insert({
      user_id: user.id,
      action: 'marketplace_configured',
      message: `Configurações da ${platform} salvas com sucesso.`
    });

    return { success: true };
  });

  // 3. Testar Conexão (Mock por enquanto)
  fastify.post('/test', { preHandler: requireAuth }, async (request, reply) => {
    const { platform } = request.body as any;
    // Aqui faríamos uma chamada real para a Shopee ou Meli.
    // Como a Shopee exige build de URL complexa, vamos apenas retornar "configured_pending_validation".
    return { status: 'configured_pending_validation', message: 'Configurações salvas. Faça uma busca para testar na prática.' };
  });
}
