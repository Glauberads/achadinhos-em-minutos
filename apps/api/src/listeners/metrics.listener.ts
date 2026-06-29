import { DomainEvent } from '../events';

/**
 * MetricsListener
 * Responsável por atualizar contadores internos (Prometheus/Grafana).
 * Mantém dados em memória ou Redis para métricas de performance e volume.
 */
class MetricsListener {
  
  // Exemplo de métricas em memória (poderia ser client Prometheus)
  private metrics = {
    eventsDispatched: 0,
    errorsEncountered: 0,
  };

  async handle(event: DomainEvent) {
    this.metrics.eventsDispatched++;
    
    // Verifica se é um evento de falha para contar erros
    if (event.event_name.includes('Failed') || event.event_name.includes('Error')) {
      this.metrics.errorsEncountered++;
    }

    if (process.env.NODE_ENV === 'development' && this.metrics.eventsDispatched % 10 === 0) {
      console.log(`[MetricsListener] Internal metrics updated. Total events: ${this.metrics.eventsDispatched}`);
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

export const metricsListener = new MetricsListener();
