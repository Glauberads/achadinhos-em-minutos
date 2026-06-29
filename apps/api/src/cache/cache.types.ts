export interface CacheHealthResponse {
  connected: boolean;
  latency_ms: number;
  memory_used: string;
  keys_estimated: number;
  status: 'healthy' | 'unhealthy' | 'degraded';
  last_error: string | null;
}

export interface CacheOptions {
  ttlSeconds?: number;
  namespace?: string;
}

export type CachePrimitive = string | number | boolean | null;
export type CacheObject = { [key: string]: any };
export type CacheValue = CachePrimitive | CacheObject | Array<any>;
