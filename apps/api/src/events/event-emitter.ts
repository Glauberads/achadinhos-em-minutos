import { EventEmitter } from 'events';
import { DomainEvent } from './event-types';

/**
 * Wrapper interno sobre o EventEmitter nativo do Node.js.
 * Essa é a camada de transporte atual (em memória).
 * Futuramente pode ser substituído por Redis Pub/Sub, Kafka, SQS, etc.,
 * sem precisar alterar nenhum Service ou Worker, apenas reescrevendo esta interface.
 */
class InternalEventEmitter {
  private emitter = new EventEmitter();

  constructor() {
    // Aumentar o limite de listeners para evitar warnings de memory leak
    // já que teremos múltiplos Listeners (Audit, Analytics, etc.) para o mesmo evento.
    this.emitter.setMaxListeners(50);
  }

  public emit(event: DomainEvent): void {
    // O evento sempre é disparado usando o `event_name` como chave (ex: 'ProductImportedEvent')
    this.emitter.emit(event.event_name, event);
    
    // Opcional: disparar um evento "coringa" para listeners que querem ouvir tudo (ex: Logger, Metrics)
    this.emitter.emit('*', event);
  }

  public on(eventName: string, listener: (event: DomainEvent) => void | Promise<void>): void {
    this.emitter.on(eventName, listener);
  }

  public onAny(listener: (event: DomainEvent) => void | Promise<void>): void {
    this.emitter.on('*', listener);
  }
}

export const eventEmitter = new InternalEventEmitter();
