import { ProductImportedEvent, CampaignStartedEvent, CampaignStoppedEvent, MarketplaceCredentialsUpdatedEvent, CampaignFinishedEvent, TelegramSentEvent, TelegramFailedEvent, DomainEvent } from '../events';
import { cacheService } from '../services/cache.service';
import { CacheKeys } from '../cache/cache-keys';

/**
 * CacheListener
 * Responsável por invalidar ou atualizar chaves de cache no Redis
 * sempre que dados relevantes mudam.
 */
class CacheListener {
  
  async invalidateProductCache(event: ProductImportedEvent) {
    if (!event.user_id) return;
    
    const pattern = `dashboard:metrics:${event.user_id}:*`;
    await cacheService.deletePattern(pattern);
  }

  async invalidateCampaignCache(event: CampaignStartedEvent | CampaignStoppedEvent) {
    if (!event.user_id) return;
    
    // Invalida cache de campaign para este user
    const campaignId = (event.payload as any).campaign_id;
    if (campaignId) {
       const key = CacheKeys.campaign.summary(event.user_id, campaignId);
       await cacheService.delete(key);
    }
    
    const pattern = `dashboard:metrics:${event.user_id}:*`;
    await cacheService.deletePattern(pattern);
  }
  
  async onMarketplaceCredentialsUpdated(event: MarketplaceCredentialsUpdatedEvent) {
    if (event.user_id) {
      const { provider } = event.payload;
      const pattern = `marketplace:${provider}:search:${event.user_id}:*`;
      await cacheService.deletePattern(pattern);
    }
  }

  async invalidateDashboardOnly(event: DomainEvent) {
    if (!event.user_id) return;
    const pattern = `dashboard:metrics:${event.user_id}:*`;
    await cacheService.deletePattern(pattern);
  }
}

export const cacheListener = new CacheListener();
