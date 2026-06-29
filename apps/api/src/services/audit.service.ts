import { DomainEvent } from '../events';
import { auditRepository } from '../repositories/audit.repository';
import { supabaseAdmin } from '../lib/supabase';

/**
 * AuditService — Centraliza sanitização e transformação de logs de auditoria.
 * Redireciona a antiga tabela `system_logs` para a nova `audit_logs` (Fase 5).
 */
export class AuditService {

  /**
   * Remove dados sensíveis antes de gravar no banco de dados.
   * Regra de Segurança: Nunca expor secrets, tokens, senhas ou keys.
   */
  public sanitizeAuditPayload(payload: any): any {
    if (!payload) return payload;

    const sanitized = JSON.parse(JSON.stringify(payload)); // Deep clone simples
    
    const sensitiveKeys = [
      'token', 'access_token', 'refresh_token', 'password', 'secret', 
      'api_key', 'authorization', 'bearer'
    ];

    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const lowerKey = key.toLowerCase();
          const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
          
          if (isSensitive) {
            obj[key] = '*** REDACTED ***';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    if (typeof sanitized === 'object') {
      sanitizeObject(sanitized);
    }
    
    return sanitized;
  }

  /**
   * Converte um DomainEvent em um registro para o AuditRepository.
   */
  public async logEvent(event: DomainEvent): Promise<void> {
    const isError = event.event_name.includes('Failed') || event.event_name.includes('Error');
    
    // Extrai propriedades dependendo de se o payload possui informações de erro ou entidades
    const payload = event.payload as any;
    const entityId = payload?.product_id || payload?.campaign_id || payload?.group_id || payload?.post_id || null;
    
    // Simplificar nome do evento para action
    const action = event.event_name
      .replace('Event', '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, ''); // Ex: ProductImportedEvent -> product_imported

    // Determinar qual entidade estamos lidando
    let entity = 'system';
    if (action.includes('product')) entity = 'products';
    else if (action.includes('campaign')) entity = 'campaigns';
    else if (action.includes('telegram')) entity = 'telegram';
    else if (action.includes('worker')) entity = 'workers';

    await auditRepository.createLog({
      user_id: event.user_id,
      organization_id: event.organization_id,
      event_id: event.event_id,
      event_name: event.event_name,
      action,
      entity,
      entity_id: entityId,
      severity: isError ? 'error' : 'info',
      status: isError ? 'failed' : 'success',
      source: event.source,
      correlation_id: event.correlation_id,
      metadata: this.sanitizeAuditPayload(event.payload),
      error_message: payload?.error_message || null,
      error_stack: payload?.error_stack || null,
    });
  }

  /**
   * Legacy log method (mantido para compatibilidade retroativa, mas redirecionado para a nova tabela)
   * Gradativamente será substituído pela emissão de eventos via EventBus.
   */
  async log(params: {
    userId: string;
    action: string;
    entity?: string;
    entityId?: string;
    message?: string;
    metadata?: Record<string, any>;
    level?: 'info' | 'warn' | 'error' | 'critical';
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await auditRepository.createLog({
      user_id: params.userId,
      event_name: 'LegacyLogEvent',
      action: params.action,
      entity: params.entity || 'system',
      entity_id: params.entityId,
      severity: params.level || 'info',
      status: params.level === 'error' || params.level === 'critical' ? 'failed' : 'success',
      source: 'legacy_service',
      ip: params.ip,
      user_agent: params.userAgent,
      metadata: {
        message: params.message,
        ...this.sanitizeAuditPayload(params.metadata)
      }
    });
  }

  /**
   * Legacy error shortcut
   */
  async error(userId: string, action: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log({
      userId,
      action,
      message,
      metadata,
      level: 'error',
    });
  }

  /**
   * Legacy warn shortcut
   */
  async warn(userId: string, action: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log({
      userId,
      action,
      message,
      metadata,
      level: 'warn',
    });
  }
}

export const auditService = new AuditService();
