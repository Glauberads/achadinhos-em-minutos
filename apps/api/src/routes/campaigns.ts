import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';

// Reusa a função do telegram.ts por praticidade
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

export async function campaignRoutes(fastify: FastifyInstance) {
  fastify.decorateRequest('user', null);

  // 1. Criar Campanha
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const data = request.body as any;

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: data.name,
        platform: data.platform,
        keyword: data.keyword,
        category: data.category,
        filters: data.filters || {},
        telegram_group_id: data.telegram_group_id,
        recurrence_cron: data.recurrence_cron,
        next_run_at: new Date().toISOString(), // Inicia imediatamente ou no proximo ciclo
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Falha ao criar campanha' });
    }

    return { success: true, campaign };
  });

  // 2. Listar Campanhas
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;

    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*, telegram_group:groups(group_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.code(500).send({ error: 'Falha ao listar campanhas' });
    }

    return { campaigns };
  });

  // 3. Atualizar Campanha
  fastify.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as any;
    const data = request.body as any;

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Falha ao atualizar campanha' });
    }

    return { success: true, campaign };
  });

  // 4. Pausar Campanha
  fastify.post('/:id/pause', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as any;

    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    return { success: true, status: 'paused' };
  });

  // 5. Retomar Campanha
  fastify.post('/:id/resume', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as any;

    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'active', next_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    return { success: true, status: 'active' };
  });

  // 6. Rodar Agora
  fastify.post('/:id/run-now', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as any;

    await supabaseAdmin
      .from('campaigns')
      .update({ next_run_at: new Date().toISOString() }) // Força o cron a pegar no proximo segundo
      .eq('id', id)
      .eq('user_id', user.id);

    return { success: true, message: 'Campanha colocada na fila de execução imediata.' };
  });

  // 7. Listar Logs da Campanha (Scheduled Posts recentes)
  fastify.get('/:id/logs', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as any;

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
