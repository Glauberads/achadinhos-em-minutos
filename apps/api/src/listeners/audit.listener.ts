import { DomainEvent } from '../events';
import { auditService } from '../services';

/**
 * AuditListener
 * Responsável apenas por registrar logs de todos os eventos disparados no sistema.
 */
class AuditListener {
  async handle(event: DomainEvent) {
    // Agora o auditService lida com extração, sanitização e gravação apropriada, 
    // abstraindo a lógica do Listener, que serve apenas de ponte.
    await auditService.logEvent(event);
  }
}

export const auditListener = new AuditListener();
