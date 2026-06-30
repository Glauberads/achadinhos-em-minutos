import { supabaseAdmin } from '../lib/supabase';

import { randomUUID } from 'crypto';

interface TelemetryLogData {
  correlation_id?: string;
  request_id?: string;
  job_id?: string;
  user_id?: string;
  worker?: string;
  operation_type: 'API_REQUEST' | 'WORKER_JOB' | 'AI_GENERATION' | 'FFMPEG_RENDER' | 'DB_QUERY';
  endpoint?: string;
  total_time_ms: number;
  queue_time_ms?: number;
  processing_time_ms?: number;
  db_time_ms?: number;
  cache_time_ms?: number;
  serialization_time_ms?: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'FALLBACK';
  error_message?: string;
  metadata?: any;
}

export class TelemetryService {
  public async log(data: TelemetryLogData): Promise<void> {
    try {
      const payload = {
        correlation_id: data.correlation_id || randomUUID(),
        request_id: data.request_id,
        job_id: data.job_id,
        user_id: data.user_id,
        worker: data.worker,
        operation_type: data.operation_type,
        endpoint: data.endpoint,
        total_time_ms: data.total_time_ms,
        queue_time_ms: data.queue_time_ms || 0,
        processing_time_ms: data.processing_time_ms || data.total_time_ms,
        db_time_ms: data.db_time_ms || 0,
        cache_time_ms: data.cache_time_ms || 0,
        serialization_time_ms: data.serialization_time_ms || 0,
        status: data.status,
        error_message: data.error_message,
        metadata: data.metadata || {}
      };

      // Fire and forget so we don't slow down the main execution flow
      supabaseAdmin
        .from('telemetry_logs')
        .insert([payload])
        .then(({ error }) => {
          if (error) {
            console.error('[TelemetryService] Failed to insert log:', error.message);
          }
        });
    } catch (err) {
      console.error('[TelemetryService] Exception in log:', err);
    }
  }

  // Timer helper to measure blocks of code
  public async measure<T>(
    operation_type: TelemetryLogData['operation_type'],
    operation: () => Promise<T>,
    meta?: Partial<TelemetryLogData>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      
      this.log({
        operation_type,
        total_time_ms: Math.round(end - start),
        status: 'SUCCESS',
        ...meta
      });
      
      return result;
    } catch (error: any) {
      const end = performance.now();
      
      this.log({
        operation_type,
        total_time_ms: Math.round(end - start),
        status: 'ERROR',
        error_message: error.message,
        ...meta
      });
      
      throw error;
    }
  }
}

export const telemetryService = new TelemetryService();
