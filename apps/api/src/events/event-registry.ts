import { eventEmitter } from './event-emitter';
import { DomainEvent } from './event-types';
import { auditListener } from '../listeners/audit.listener';
import { analyticsListener } from '../listeners/analytics.listener';
import { notificationListener } from '../listeners/notification.listener';
import { webhookListener } from '../listeners/webhook.listener';
import { metricsListener } from '../listeners/metrics.listener';
import { cacheListener } from '../listeners/cache.listener';

/**
 * Registra todos os Listeners do sistema.
 * Deve ser chamado na inicialização da aplicação (server.ts).
 */
export function registerEvents() {
  
  // Helper para registrar um listener com tratamento de erros (Resiliência)
  const register = (
    eventName: string | '*',
    listenerName: string,
    handler: (event: DomainEvent) => Promise<void> | void
  ) => {
    const wrappedHandler = async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        // Garante que uma falha em um Listener NUNCA quebre o EventBus ou outros Listeners
        console.error(`[Listener Error] ${listenerName} failed on ${event.event_name}:`, error);
      }
    };

    if (eventName === '*') {
      eventEmitter.onAny(wrappedHandler);
    } else {
      eventEmitter.on(eventName, wrappedHandler);
    }
  };

  // ============================
  // Registrar AuditListener
  // ============================
  // Audit ouve todos os eventos para gerar log de trilha
  register('*', 'AuditListener', (e) => auditListener.handle(e));

  // ============================
  // Registrar MetricsListener
  // ============================
  // Metrics ouve tudo para atualizar Grafana/Prometheus counters
  register('*', 'MetricsListener', (e) => metricsListener.handle(e));

  // ============================
  // Registrar AnalyticsListener
  // ============================
  register('ProductImportedEvent', 'AnalyticsListener', (e) => analyticsListener.onProductImported(e as any));
  register('SearchFinishedEvent', 'AnalyticsListener', (e) => analyticsListener.onSearchFinished(e as any));
  register('CampaignFinishedEvent', 'AnalyticsListener', (e) => analyticsListener.onCampaignFinished(e as any));

  // ============================
  // Registrar NotificationListener
  // ============================
  register('CampaignFinishedEvent', 'NotificationListener', (e) => notificationListener.onCampaignFinished(e as any));
  register('WorkerFailedEvent', 'NotificationListener', (e) => notificationListener.onWorkerFailed(e as any));
  register('TelegramFailedEvent', 'NotificationListener', (e) => notificationListener.onTelegramFailed(e as any));

  // ============================
  // Registrar CacheListener
  // ============================
  register('ProductImportedEvent', 'CacheListener', (e) => cacheListener.invalidateProductCache(e as any));
  register('CampaignStartedEvent', 'CacheListener', (e) => cacheListener.invalidateCampaignCache(e as any));
  register('CampaignStoppedEvent', 'CacheListener', (e) => cacheListener.invalidateCampaignCache(e as any));
  register('CampaignUpdatedEvent', 'CacheListener', (e) => cacheListener.invalidateCampaignCache(e as any));
  register('CampaignDeletedEvent', 'CacheListener', (e) => cacheListener.invalidateCampaignCache(e as any));
  register('MarketplaceCredentialsUpdatedEvent', 'CacheListener', (e) => cacheListener.onMarketplaceCredentialsUpdated(e as any));
  
  // Limpeza apenas do Dashboard
  register('TelegramSentEvent', 'CacheListener', (e) => cacheListener.invalidateDashboardOnly(e));
  register('TelegramFailedEvent', 'CacheListener', (e) => cacheListener.invalidateDashboardOnly(e));
  register('CampaignFinishedEvent', 'CacheListener', (e) => cacheListener.invalidateDashboardOnly(e));

  // ============================
  // Registrar WebhookListener
  // ============================
  // Ouve eventos que podem ser propagados via webhook
  register('ProductImportedEvent', 'WebhookListener', (e) => webhookListener.dispatch(e));
  register('CampaignFinishedEvent', 'WebhookListener', (e) => webhookListener.dispatch(e));

  console.log('[EventRegistry] All listeners registered successfully.');
}
