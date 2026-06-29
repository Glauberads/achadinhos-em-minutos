import { supabaseAdmin } from '../lib/supabase';

export interface AuditLogData {
  organization_id?: string | null;
  user_id?: string | null;
  event_id?: string;
  event_name: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  severity?: 'info' | 'warn' | 'error' | 'critical';
  status?: 'success' | 'failed';
  source?: string;
  request_id?: string;
  correlation_id?: string;
  ip?: string;
  user_agent?: string;
  duration_ms?: number;
  old_data?: any;
  new_data?: any;
  metadata?: any;
  error_message?: string | null;
  error_stack?: string | null;
}

export interface AuditLogFilters {
  user_id?: string;
  organization_id?: string;
  event_name?: string;
  action?: string;
  entity?: string;
  entity_id?: string;
  severity?: string;
  status?: string;
  source?: string;
  correlation_id?: string;
  request_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AuditRepository {
  private readonly TABLE = 'audit_logs';

  /**
   * Insere um log de auditoria no banco de dados.
   * Não dispara exceção por falha (para não impactar o fluxo).
   */
  async createLog(data: AuditLogData): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from(this.TABLE).insert(data);
      if (error) {
        console.error('[AuditRepository] Failed to insert audit log:', error);
      }
    } catch (err) {
      console.error('[AuditRepository] Fatal error inserting audit log:', err);
    }
  }

  /**
   * Busca logs baseados em filtros com paginação eficiente.
   */
  async findLogs(filters: AuditLogFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from(this.TABLE)
      .select('*', { count: 'exact' });

    // Aplicar filtros exatos
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.organization_id) query = query.eq('organization_id', filters.organization_id);
    if (filters.event_name) query = query.eq('event_name', filters.event_name);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entity) query = query.eq('entity', filters.entity);
    if (filters.entity_id) query = query.eq('entity_id', filters.entity_id);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.source) query = query.eq('source', filters.source);
    if (filters.correlation_id) query = query.eq('correlation_id', filters.correlation_id);
    if (filters.request_id) query = query.eq('request_id', filters.request_id);

    // Filtros de data
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);

    // Busca textual básica em campos-chave (ex: mensagem de erro ou ID)
    if (filters.search) {
      query = query.or(`error_message.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`);
    }

    // Ordenação e paginação
    query = query.order('created_at', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      items: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    };
  }

  async findByEventId(eventId: string) {
    const { data, error } = await supabaseAdmin
      .from(this.TABLE)
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByCorrelationId(correlationId: string) {
    const { data, error } = await supabaseAdmin
      .from(this.TABLE)
      .select('*')
      .eq('correlation_id', correlationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Método preparado para retenção (limpeza programada).
   * Fase futura (Data Lifecycle Management).
   */
  async deleteOldLogs(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error, count } = await supabaseAdmin
      .from(this.TABLE)
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) {
      console.error('[AuditRepository] Error deleting old logs:', error);
      return 0;
    }
    
    return count || 0;
  }
}

export const auditRepository = new AuditRepository();
