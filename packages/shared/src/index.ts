/**
 * @achadinhos/shared — Tipos e constantes compartilhados entre frontend e backend.
 * 
 * Este pacote é o ponto central para toda tipagem que precisa ser
 * consistente entre apps/web e apps/api.
 */

// ============================
// Entidades do Banco
// ============================

export interface Product {
  id: string;
  user_id: string;
  title: string;
  original_price: number | null;
  current_price: number;
  discount: number | null;
  image_url: string | null;
  source_url: string | null;
  affiliate_link: string | null;
  platform: 'shopee' | 'mercadolivre' | 'manual';
  external_id: string | null;
  rating: number | null;
  sold_count: number | null;
  category: string | null;
  free_shipping: boolean;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Group {
  id: string;
  user_id: string;
  platform: string;
  group_name: string;
  external_group_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  keyword: string | null;
  category: string | null;
  filters: Record<string, any>;
  telegram_group_id: string;
  recurrence_cron: string;
  next_run_at: string | null;
  status: 'active' | 'paused' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  telegram_group?: { group_name: string } | null;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  campaign_id: string | null;
  product_id: string;
  group_id: string;
  send_at: string;
  status: 'pending' | 'queued' | 'sent' | 'failed' | 'cancelled';
  queued_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SendLog {
  id: string;
  user_id: string;
  product_id: string | null;
  group_id: string | null;
  status: 'success' | 'failed';
  error_message: string | null;
  sent_at: string;
}

export interface SystemLog {
  id: string;
  user_id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  level: 'info' | 'warn' | 'error';
  message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================
// Constantes
// ============================

export const PLATFORMS = ['shopee', 'mercadolivre'] as const;
export type Platform = typeof PLATFORMS[number];

export const CAMPAIGN_STATUSES = ['active', 'paused', 'completed', 'failed'] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

export const POST_STATUSES = ['pending', 'queued', 'sent', 'failed', 'cancelled'] as const;
export type PostStatus = typeof POST_STATUSES[number];

export const SEND_STATUSES = ['success', 'failed'] as const;
export type SendStatus = typeof SEND_STATUSES[number];

// ============================
// API Response Types
// ============================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
