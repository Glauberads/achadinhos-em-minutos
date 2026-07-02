import { randomUUID } from 'crypto';

/**
 * Base Event class.
 * All domain events must inherit from this class.
 */
export abstract class DomainEvent<T = any> {
  public readonly event_id: string;
  public readonly event_name: string;
  public readonly timestamp: string;
  public readonly payload: T;
  
  // Observability metadata
  public source?: string;
  public user_id?: string;
  public organization_id?: string;
  public correlation_id?: string;

  constructor(eventName: string, payload: T, meta?: { source?: string; user_id?: string; organization_id?: string; correlation_id?: string }) {
    this.event_id = randomUUID();
    this.event_name = eventName;
    this.timestamp = new Date().toISOString();
    this.payload = payload;
    
    if (meta) {
      this.source = meta.source;
      this.user_id = meta.user_id;
      this.organization_id = meta.organization_id;
      this.correlation_id = meta.correlation_id;
    }
  }
}

// ============================
// Produtos
// ============================

export class ProductImportedEvent extends DomainEvent<{
  product_id: string;
  platform: string;
  external_id: string;
}> {
  constructor(payload: { product_id: string; platform: string; external_id: string }, meta?: any) {
    super('ProductImportedEvent', payload, meta);
  }
}

export class ProductSavedEvent extends DomainEvent<{
  product_id: string;
}> {
  constructor(payload: { product_id: string }, meta?: any) {
    super('ProductSavedEvent', payload, meta);
  }
}

// ============================
// Buscas
// ============================

export class SearchStartedEvent extends DomainEvent<{
  keyword: string;
  platform: string;
}> {
  constructor(payload: { keyword: string; platform: string }, meta?: any) {
    super('SearchStartedEvent', payload, meta);
  }
}

export class SearchFinishedEvent extends DomainEvent<{
  keyword: string;
  platform: string;
  total_found: number;
  job_id?: string;
}> {
  constructor(payload: { keyword: string; platform: string; total_found: number; job_id?: string }, meta?: any) {
    super('SearchFinishedEvent', payload, meta);
  }
}

// ============================
// Campanhas
// ============================

export class CampaignStartedEvent extends DomainEvent<{
  campaign_id: string;
}> {
  constructor(payload: { campaign_id: string }, meta?: any) {
    super('CampaignStartedEvent', payload, meta);
  }
}

export class CampaignPausedEvent extends DomainEvent<{
  campaign_id: string;
}> {
  constructor(payload: { campaign_id: string }, meta?: any) {
    super('CampaignPausedEvent', payload, meta);
  }
}

export class CampaignStoppedEvent extends DomainEvent<{
  campaign_id: string;
}> {
  constructor(payload: { campaign_id: string }, meta?: any) {
    super('CampaignStoppedEvent', payload, meta);
  }
}

export class CampaignUpdatedEvent extends DomainEvent<{
  campaign_id: string;
}> {
  constructor(payload: { campaign_id: string }, meta?: any) {
    super('CampaignUpdatedEvent', payload, meta);
  }
}

export class CampaignDeletedEvent extends DomainEvent<{
  campaign_id: string;
}> {
  constructor(payload: { campaign_id: string }, meta?: any) {
    super('CampaignDeletedEvent', payload, meta);
  }
}

export class CampaignFinishedEvent extends DomainEvent<{
  campaign_id: string;
  imported_count: number;
  queued_count: number;
}> {
  constructor(payload: { campaign_id: string; imported_count: number; queued_count: number }, meta?: any) {
    super('CampaignFinishedEvent', payload, meta);
  }
}

// ============================
// Telegram
// ============================

export class TelegramQueuedEvent extends DomainEvent<{
  post_id: string;
  group_id: string;
  product_id: string;
}> {
  constructor(payload: { post_id: string; group_id: string; product_id: string }, meta?: any) {
    super('TelegramQueuedEvent', payload, meta);
  }
}

export class TelegramSentEvent extends DomainEvent<{
  post_id: string;
  group_id: string;
  product_id: string;
}> {
  constructor(payload: { post_id: string; group_id: string; product_id: string }, meta?: any) {
    super('TelegramSentEvent', payload, meta);
  }
}

export class TelegramFailedEvent extends DomainEvent<{
  post_id: string;
  group_id: string;
  product_id: string;
  error_message: string;
}> {
  constructor(payload: { post_id: string; group_id: string; product_id: string; error_message: string }, meta?: any) {
    super('TelegramFailedEvent', payload, meta);
  }
}

// ============================
// Afiliados
// ============================

export class AffiliateValidatedEvent extends DomainEvent<{
  product_id: string;
  is_valid: boolean;
}> {
  constructor(payload: { product_id: string; is_valid: boolean }, meta?: any) {
    super('AffiliateValidatedEvent', payload, meta);
  }
}

// ============================
// Workers
// ============================

export class WorkerStartedEvent extends DomainEvent<{
  worker_name: string;
  job_id: string;
}> {
  constructor(payload: { worker_name: string; job_id: string }, meta?: any) {
    super('WorkerStartedEvent', payload, meta);
  }
}

export class WorkerFinishedEvent extends DomainEvent<{
  worker_name: string;
  job_id: string;
  duration_ms: number;
}> {
  constructor(payload: { worker_name: string; job_id: string; duration_ms: number }, meta?: any) {
    super('WorkerFinishedEvent', payload, meta);
  }
}

export class WorkerFailedEvent extends DomainEvent<{
  worker_name: string;
  job_id: string;
  error_message: string;
}> {
  constructor(payload: { worker_name: string; job_id: string; error_message: string }, meta?: any) {
    super('WorkerFailedEvent', payload, meta);
  }
}

// ============================
// Sistema
// ============================

export class NotificationCreatedEvent extends DomainEvent<{
  notification_id: string;
  type: string;
}> {
  constructor(payload: { notification_id: string; type: string }, meta?: any) {
    super('NotificationCreatedEvent', payload, meta);
  }
}

export class WebhookDispatchedEvent extends DomainEvent<{
  webhook_id: string;
  event_type: string;
  success: boolean;
}> {
  constructor(payload: { webhook_id: string; event_type: string; success: boolean }, meta?: any) {
    super('WebhookDispatchedEvent', payload, meta);
  }
}

export class FeatureEnabledEvent extends DomainEvent<{
  feature_key: string;
}> {
  constructor(payload: { feature_key: string }, meta?: any) {
    super('FeatureEnabledEvent', payload, meta);
  }
}

export class FeatureDisabledEvent extends DomainEvent<{
  feature_key: string;
}> {
  constructor(payload: { feature_key: string }, meta?: any) {
    super('FeatureDisabledEvent', payload, meta);
  }
}

export class MarketplaceCredentialsUpdatedEvent extends DomainEvent<{
  provider: string;
}> {
  constructor(payload: { provider: string }, meta?: any) {
    super('MarketplaceCredentialsUpdatedEvent', payload, meta);
  }
}

// ============================
// Cache
// ============================

export class CacheHitEvent extends DomainEvent<{
  key: string;
  namespace?: string;
}> {
  constructor(payload: { key: string; namespace?: string }, meta?: any) {
    super('CacheHitEvent', payload, meta);
  }
}

export class CacheMissEvent extends DomainEvent<{
  key: string;
  namespace?: string;
}> {
  constructor(payload: { key: string; namespace?: string }, meta?: any) {
    super('CacheMissEvent', payload, meta);
  }
}

export class CacheSetEvent extends DomainEvent<{
  key: string;
  namespace?: string;
  ttl_seconds?: number;
}> {
  constructor(payload: { key: string; namespace?: string; ttl_seconds?: number }, meta?: any) {
    super('CacheSetEvent', payload, meta);
  }
}

export class CacheDeleteEvent extends DomainEvent<{
  key: string;
}> {
  constructor(payload: { key: string }, meta?: any) {
    super('CacheDeleteEvent', payload, meta);
  }
}

export class CacheInvalidatedEvent extends DomainEvent<{
  pattern: string;
  keys_deleted?: number;
}> {
  constructor(payload: { pattern: string; keys_deleted?: number }, meta?: any) {
    super('CacheInvalidatedEvent', payload, meta);
  }
}

export class CacheErrorEvent extends DomainEvent<{
  operation: string;
  key?: string;
  error_message: string;
}> {
  constructor(payload: { operation: string; key?: string; error_message: string }, meta?: any) {
    super('CacheErrorEvent', payload, meta);
  }
}

export class CacheHealthCheckEvent extends DomainEvent<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency_ms: number;
}> {
  constructor(payload: { status: 'healthy' | 'unhealthy' | 'degraded'; latency_ms: number }, meta?: any) {
    super('CacheHealthCheckEvent', payload, meta);
  }
}

// ============================
// Creative Studio
// ============================

export class CreativeGenerationStartedEvent extends DomainEvent<{
  creative_id: string;
  product_url: string;
}> {
  constructor(payload: { creative_id: string; product_url: string }, meta?: any) {
    super('CreativeGenerationStartedEvent', payload, meta);
  }
}

export class CreativeGeneratedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeGeneratedEvent', payload, meta);
  }
}

export class CreativeFallbackGeneratedEvent extends DomainEvent<{
  creative_id: string;
  reason: string;
}> {
  constructor(payload: { creative_id: string; reason: string }, meta?: any) {
    super('CreativeFallbackGeneratedEvent', payload, meta);
  }
}

export class CreativeFailedEvent extends DomainEvent<{
  creative_id: string;
  error_message: string;
}> {
  constructor(payload: { creative_id: string; error_message: string }, meta?: any) {
    super('CreativeFailedEvent', payload, meta);
  }
}

export class CreativeSavedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeSavedEvent', payload, meta);
  }
}

export class CreativeUpdatedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeUpdatedEvent', payload, meta);
  }
}

export class CreativeDeletedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeDeletedEvent', payload, meta);
  }
}

export class CreativeRenderStartedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeRenderStartedEvent', payload, meta);
  }
}

export class CreativeRenderFinishedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeRenderFinishedEvent', payload, meta);
  }
}

export class CreativeRenderFailedEvent extends DomainEvent<{
  creative_id: string;
  error_message: string;
}> {
  constructor(payload: { creative_id: string; error_message: string }, meta?: any) {
    super('CreativeRenderFailedEvent', payload, meta);
  }
}

export class CreativeSelectedEvent extends DomainEvent<{
  creative_id: string;
}> {
  constructor(payload: { creative_id: string }, meta?: any) {
    super('CreativeSelectedEvent', payload, meta);
  }
}

export class CreativeAnalyticsRegisteredEvent extends DomainEvent<{
  creative_id: string;
  conversions: number;
}> {
  constructor(payload: { creative_id: string; conversions: number }, meta?: any) {
    super('CreativeAnalyticsRegisteredEvent', payload, meta);
  }
}

export class CreativeImageUploadStarted extends DomainEvent<{
  creative_id: string;
  filename: string;
}> {
  constructor(payload: { creative_id: string; filename: string }, meta?: any) {
    super('CreativeImageUploadStarted', payload, meta);
  }
}

export class CreativeImageUploaded extends DomainEvent<{
  creative_id: string;
  url: string;
}> {
  constructor(payload: { creative_id: string; url: string }, meta?: any) {
    super('CreativeImageUploaded', payload, meta);
  }
}

export class CreativeImageUploadFailed extends DomainEvent<{
  creative_id: string;
  error: string;
}> {
  constructor(payload: { creative_id: string; error: string }, meta?: any) {
    super('CreativeImageUploadFailed', payload, meta);
  }
}

export class CreativeFallbackAccepted extends DomainEvent<{
  creative_id: string;
  strategy: string;
}> {
  constructor(payload: { creative_id: string; strategy: string }, meta?: any) {
    super('CreativeFallbackAccepted', payload, meta);
  }
}
