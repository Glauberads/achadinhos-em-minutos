import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Middleware de autenticação centralizado.
 * 
 * Extrai e valida o JWT do header Authorization via Supabase Auth.
 * Pendura o usuário autenticado em `request.user` para uso nas rotas.
 * 
 * Substitui as implementações duplicadas que existiam em:
 * - routes/telegram.ts
 * - routes/campaigns.ts
 * - routes/marketplaces.ts
 * - routes/products.ts
 * 
 * Uso: { preHandler: requireAuth }
 */
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
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

  // Pendura o usuário autenticado na request
  request.user = user;
};

/**
 * Extrai o IP do cliente da request, considerando proxies.
 */
export const getClientIp = (request: FastifyRequest): string => {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return request.ip || 'unknown';
};

/**
 * Extrai o User-Agent da request.
 */
export const getUserAgent = (request: FastifyRequest): string => {
  return (request.headers['user-agent'] as string) || 'unknown';
};

// Tipagem para o Fastify entender request.user
declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}
