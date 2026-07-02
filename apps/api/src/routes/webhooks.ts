import { FastifyInstance } from 'fastify';
import { subscriptionService } from '../services/subscription.service';

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/asaas', async (request, reply) => {
    const asaasToken = request.headers['asaas-access-token'];
    
    // Validação do Webhook Token
    if (process.env.ASAAS_WEBHOOK_TOKEN && asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      fastify.log.warn('Webhook Asaas inválido recebido.');
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const event = request.body as any;
    
    if (!event || !event.event) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    try {
      if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        // Se for um pagamento avulso (PIX)
        if (event.payment?.id) {
          await subscriptionService.handleWebhookPaymentConfirmed(event.payment.id);
        }
      }
      
      // Lógica de idempotência seria aqui verificando um Redis Set com o event.id, 
      // mas como handleWebhookPaymentConfirmed atualiza o estado deterministicamente, é seguro chamar várias vezes.

      return reply.send({ success: true });
    } catch (e: any) {
      fastify.log.error('Erro ao processar webhook do Asaas:', e);
      return reply.code(500).send({ error: e.message });
    }
  });
}
