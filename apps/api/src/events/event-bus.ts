import { DomainEvent } from './event-types';
import { eventEmitter } from './event-emitter';

/**
 * EventBus — Camada de publicação de eventos.
 * Segue o padrão Singleton.
 * Serviços e Workers DEVEM usar `EventBus.emit()` e NUNCA acessar o `eventEmitter` diretamente.
 */
export class EventBus {
  
  /**
   * Dispara um evento de domínio no sistema.
   * O método não aguarda a execução dos Listeners (Fire and Forget),
   * garantindo que a emissão não bloqueie o fluxo principal de quem chamou.
   * 
   * @param event Instância de um DomainEvent
   */
  public emit(event: DomainEvent): void {
    // Calculamos execution_time do próprio EventBus (tempo para despachar)
    const start = performance.now();
    
    try {
      eventEmitter.emit(event);
      
      const end = performance.now();
      // Podemos logar no debug, mas evitamos console.log em produção para não poluir
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EventBus] Dispatched ${event.event_name} [ID: ${event.event_id}] in ${(end - start).toFixed(2)}ms`);
      }
    } catch (error) {
      // Se o próprio despachante falhar (muito raro em EventEmitter na memória)
      console.error(`[EventBus] FATAL ERROR dispatching ${event.event_name}:`, error);
    }
  }
}

export const eventBus = new EventBus();
