import { CampaignFinishedEvent, WorkerFailedEvent, TelegramFailedEvent } from '../events';

/**
 * NotificationListener
 * Responsável apenas por criar notificações no banco (Phase 15 integration).
 */
class NotificationListener {
  
  async onCampaignFinished(event: CampaignFinishedEvent) {
    if (!event.user_id) return;
    
    // Preparado para a Fase 15 (Central de Notificações)
    console.log(`[NotificationListener] Campaign finished notification for user ${event.user_id}`);
  }

  async onWorkerFailed(event: WorkerFailedEvent) {
    if (!event.user_id) return;
    
    console.log(`[NotificationListener] Alerting user ${event.user_id} about worker failure: ${event.payload.error_message}`);
  }

  async onTelegramFailed(event: TelegramFailedEvent) {
    if (!event.user_id) return;
    
    console.log(`[NotificationListener] Alerting user ${event.user_id} about telegram failure: ${event.payload.error_message}`);
  }
}

export const notificationListener = new NotificationListener();
