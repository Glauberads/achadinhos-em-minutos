import { ProductImportedEvent, SearchFinishedEvent, CampaignFinishedEvent } from '../events';
import { supabaseAdmin } from '../lib/supabase';

/**
 * AnalyticsListener
 * Responsável apenas por atualizar métricas a partir de eventos.
 */
class AnalyticsListener {
  
  async onProductImported(event: ProductImportedEvent) {
    if (!event.user_id) return;
    
    // Futura integração com a tabela campaign_metrics (Fase 11)
    console.log(`[AnalyticsListener] Incrementing product_imported for user ${event.user_id}`);
  }

  async onSearchFinished(event: SearchFinishedEvent) {
    if (!event.user_id) return;
    
    // Incrementa contadores de buscas realizadas
    console.log(`[AnalyticsListener] Recording search for platform ${event.payload.platform}`);
  }

  async onCampaignFinished(event: CampaignFinishedEvent) {
    if (!event.user_id) return;
    
    // Atualiza estatísticas da campanha
    console.log(`[AnalyticsListener] Campaign ${event.payload.campaign_id} finished with ${event.payload.imported_count} imported`);
  }
}

export const analyticsListener = new AnalyticsListener();
