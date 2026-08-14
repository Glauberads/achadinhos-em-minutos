import { aiGovernanceRepository } from '../repositories/ai-governance.repository';
import { aiCryptoService } from './ai-crypto.service';
import { AIProviderType } from '@achadinhos/shared';

export interface ResolvedCredential {
  apiKey: string;
  source: 'database' | 'environment';
}

export class AICredentialResolver {
  /**
   * Resolve a credencial para um dado provider.
   * Prioridade 1: Banco de Dados
   * Prioridade 2: Fallback temporário para .env se for Gemini (legado)
   */
  async resolveCredential(providerId: string, providerType: AIProviderType): Promise<ResolvedCredential> {
    // 1. Tentar Banco de Dados
    try {
      const encryptedPayload = await aiGovernanceRepository.getEncryptedCredential(providerId);
      
      if (encryptedPayload) {
        const apiKey = aiCryptoService.decrypt(encryptedPayload);
        return {
          apiKey,
          source: 'database',
        };
      }
    } catch (error) {
      console.error(`[AICredentialResolver] Erro ao descriptografar credencial do provider ${providerId}:`, error);
      // Se a descriptografia falhar, não faremos fallback silencioso para o .env por segurança.
      throw new Error(`AIConfigurationError: Falha na integridade da credencial do provider ${providerId}.`);
    }

    // 2. Fallback temporário para Gemini no .env
    if (providerType === 'gemini') {
      const legacyKey = process.env.GEMINI_API_KEY;
      if (legacyKey) {
        return {
          apiKey: legacyKey,
          source: 'environment',
        };
      }
    }

    throw new Error(`AIConfigurationError: Nenhuma credencial configurada para o provider ${providerId} (${providerType}).`);
  }
}

export const aiCredentialResolver = new AICredentialResolver();
