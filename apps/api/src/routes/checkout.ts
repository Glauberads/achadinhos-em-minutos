import { FastifyInstance } from 'fastify';
import { subscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

export async function checkoutRoutes(fastify: FastifyInstance) {
  // Middleware simples de Auth
  fastify.addHook('onRequest', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    (request as any).user = user;
  });

  fastify.post('/pix', async (request, reply) => {
    const user = (request as any).user;
    
    const schema = z.object({
      name: z.string(),
      cpfCnpj: z.string(),
    });

    try {
      const { name, cpfCnpj } = schema.parse(request.body);
      
      const result = await subscriptionService.createPixPayment(
        user.id,
        user.email,
        name,
        cpfCnpj
      );

      return reply.send(result);
    } catch (e: any) {
      fastify.log.error(e);
      return reply.code(400).send({ error: e.message });
    }
  });

  fastify.post('/credit-card', async (request, reply) => {
    const user = (request as any).user;
    
    const schema = z.object({
      name: z.string(),
      cpfCnpj: z.string(),
      creditCardToken: z.string(),
    });

    try {
      const { name, cpfCnpj, creditCardToken } = schema.parse(request.body);
      
      const subscription = await subscriptionService.createCreditCardSubscription(
        user.id,
        user.email,
        name,
        cpfCnpj,
        creditCardToken
      );

      return reply.send({ subscriptionId: subscription.id, status: subscription.status });
    } catch (e: any) {
      fastify.log.error(e);
      return reply.code(400).send({ error: e.message });
    }
  });
}
