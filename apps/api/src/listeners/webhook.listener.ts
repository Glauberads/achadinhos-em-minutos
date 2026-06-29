import { DomainEvent } from '../events';

/**
 * WebhookListener
 * Responsável por propagar eventos via webhooks configurados pelo usuário.
 */
class WebhookListener {
  
  async dispatch(event: DomainEvent) {
    if (!event.user_id) return;
    
    // Futura integração com a tabela webhooks (Fase 17)
    // Se o usuário tiver um webhook registrado para event.event_name, dispara via HTTP (Axios/Fetch)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebhookListener] Preparing to dispatch ${event.event_name} to user ${event.user_id} webhooks`);
    }
  }
}

export const webhookListener = new WebhookListener();
