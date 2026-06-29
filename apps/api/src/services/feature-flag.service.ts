import { supabaseAdmin } from '../lib/supabase';
import { cacheService } from './cache.service';
import { CacheKeys } from '../cache/cache-keys';
import { eventBus, FeatureEnabledEvent, FeatureDisabledEvent } from '../events';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  target_type: 'global' | 'plan' | 'organization' | 'user';
  target_ids: string[];
  metadata: any;
}

export interface FeatureFlagContext {
  userId?: string;
  organizationId?: string;
  plan?: string;
}

/**
 * FeatureFlagService — Gerencia liberação condicional de recursos (Fase 10).
 * Integra pesadamente com CacheService para zero latência no DB.
 */
export class FeatureFlagService {

  /**
   * Verifica se uma feature flag está ativa para um contexto específico.
   * Utiliza Cache (TTL 5 minutos) para proteger o Supabase.
   */
  async isEnabled(key: string, context: FeatureFlagContext = {}): Promise<boolean> {
    // Para resolver no cache, armazenamos todo o array de flags e checamos na memória
    const flags = await this.getAllFlagsCached();
    const flag = flags.find(f => f.key === key);

    if (!flag) return false;

    // Se a flag inteira está desabilitada
    if (!flag.enabled) return false;

    // Se for global e enabled=true
    if (flag.target_type === 'global') return true;

    // Se for restrita a usuários específicos
    if (flag.target_type === 'user' && context.userId) {
      return flag.target_ids.includes(context.userId);
    }

    // Se for restrita a organizações (Fase 14)
    if (flag.target_type === 'organization' && context.organizationId) {
      return flag.target_ids.includes(context.organizationId);
    }

    // Se for restrita a planos de assinatura (Fase 18)
    if (flag.target_type === 'plan' && context.plan) {
      // Neste caso os target_ids conteriam os nomes/IDs dos planos (ex: 'pro', 'enterprise')
      // Ajustaremos na Fase 18 se necessário, mas o core já suporta.
      return flag.target_ids.includes(context.plan);
    }

    return false;
  }

  /**
   * Retorna todas as flags (cacheadas por 5 min)
   */
  async getAllFlagsCached(): Promise<FeatureFlag[]> {
    const cacheKey = 'system:feature-flags:all';
    
    return await cacheService.remember(cacheKey, 300, async () => {
      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .select('*');

      if (error) {
        console.error('[FeatureFlagService] Failed to load flags:', error);
        return [];
      }
      return data as FeatureFlag[];
    });
  }

  /**
   * ADMIN ONLY: Atualiza o status de uma flag.
   */
  async toggleFlag(key: string, enabled: boolean, adminUserId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      console.error('[FeatureFlagService] Error toggling flag:', error);
      return false;
    }

    // Limpar cache global das flags
    await cacheService.delete('system:feature-flags:all');

    // Disparar Evento para auditoria e log
    const meta = { user_id: adminUserId, source: 'feature-flag-service' };
    if (enabled) {
      eventBus.emit(new FeatureEnabledEvent({ feature_key: key }, meta));
    } else {
      eventBus.emit(new FeatureDisabledEvent({ feature_key: key }, meta));
    }

    return true;
  }

}

export const featureFlagService = new FeatureFlagService();
