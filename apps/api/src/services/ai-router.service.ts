import { AICapability, AIProviderType } from '@achadinhos/shared';
import { aiGovernanceRepository } from '../repositories/ai-governance.repository';

export interface AIRouteResolution {
  capability: AICapability;
  primary: {
    providerId: string | 'legacy-env';
    providerType: AIProviderType;
    modelKey: string;
  };
  fallback?: {
    providerId: string;
    providerType: AIProviderType;
    modelKey: string;
  };
}

export class AIRouterService {
  /**
   * Resolve a rota de IA baseada na tabela ai_capability_routes, validando integridade.
   * Não executa IA, não pega credencial. Apenas decide para ONDE rotear.
   */
  async resolveRoute(capability: AICapability): Promise<AIRouteResolution> {
    const route = await aiGovernanceRepository.getRouteByCapability(capability);

    if (!route || !route.enabled) {
      // 1. Política de ENV Legacy Exception
      // Se não houver configuração de banco de dados, usamos Gemini padrão do ENV
      console.warn(`[AIRouter] Nenhuma rota encontrada para ${capability}. Fazendo fallback para legacy ENV.`);
      return {
        capability,
        primary: {
          providerId: 'legacy-env',
          providerType: 'gemini',
          modelKey: 'gemini-1.5-flash',
        }
      };
    }

    // Validar provedor e modelo primário
    const primaryProvider = await aiGovernanceRepository.getProviderById(route.primaryProviderId);
    if (!primaryProvider) {
      throw new Error(`AIConfigurationError: Primary provider ${route.primaryProviderId} não encontrado.`);
    }
    if (!primaryProvider.enabled) {
      throw new Error(`AIConfigurationError: Primary provider ${primaryProvider.displayName} está desabilitado.`);
    }
    
    // Na nossa lógica simplificada, capabilities de provider são a união dos modelos.
    // O modelo deve ter a capability.
    const models = await aiGovernanceRepository.getModels(route.primaryProviderId);
    const primaryModel = models.find(m => m.id === route.primaryModelId);
    
    if (!primaryModel) {
      throw new Error(`AIConfigurationError: Primary model não pertence ao provider primário.`);
    }
    if (!primaryModel.enabled) {
      throw new Error(`AIConfigurationError: Primary model ${primaryModel.modelKey} está desabilitado.`);
    }
    if (!primaryModel.capabilities.includes(capability)) {
      throw new Error(`AIConfigurationError: Primary model ${primaryModel.modelKey} não suporta a capability ${capability}.`);
    }

    const resolution: AIRouteResolution = {
      capability,
      primary: {
        providerId: route.primaryProviderId,
        providerType: primaryProvider.providerType,
        modelKey: primaryModel.modelKey,
      }
    };

    // Validar fallback (opcional)
    if (route.fallbackProviderId && route.fallbackModelId) {
      const fallbackProvider = await aiGovernanceRepository.getProviderById(route.fallbackProviderId);
      const fallbackModels = await aiGovernanceRepository.getModels(route.fallbackProviderId);
      const fallbackModel = fallbackModels.find(m => m.id === route.fallbackModelId);

      if (fallbackProvider?.enabled && fallbackModel?.enabled && fallbackModel.capabilities.includes(capability)) {
        resolution.fallback = {
          providerId: route.fallbackProviderId,
          providerType: fallbackProvider.providerType,
          modelKey: fallbackModel.modelKey,
        };
      }
    }

    return resolution;
  }
}

export const aiRouterService = new AIRouterService();
