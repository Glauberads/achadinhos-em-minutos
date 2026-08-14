import { FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from './auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

/**
 * Middleware para garantir que o usuário logado possui a role 'superadmin' 
 * na tabela global 'profiles'.
 * 
 * Uso: { preHandler: [requireAuth, requireSuperadmin] }
 * Ou pode ser usado de forma autônoma que chamará requireAuth por baixo.
 */
export const requireSuperadmin = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // Garantir autenticação base primeiro (se não estiver já executada)
  if (!request.user) {
    await requireAuth(request, reply);
    if (reply.sent) return; // Parar se a autenticação falhar
  }

  const userId = request.user.id;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('platform_role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      reply.status(403).send({ error: 'Acesso negado: Perfil não encontrado.' });
      return;
    }

    if (profile.platform_role !== 'superadmin') {
      reply.status(403).send({ error: 'Acesso negado: Permissão insuficiente.' });
      return;
    }
    
    // Pass - Acesso concedido
  } catch (err) {
    console.error('[requireSuperadmin] Erro ao validar superadmin:', err);
    reply.status(403).send({ error: 'Acesso negado: Erro de validação de permissão.' });
  }
};
