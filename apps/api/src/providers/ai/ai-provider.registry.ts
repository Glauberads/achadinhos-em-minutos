import { AIProviderType } from '@achadinhos/shared';
import { AIProvider } from './ai.provider.interface';
import { GeminiProvider } from './gemini.provider';

export class AIProviderRegistry {
  /**
   * Instancia e retorna a implementação correta do provider.
   * Não executa roteamento, apenas atua como Factory.
   */
  getProvider(type: AIProviderType, apiKey: string, modelConfig?: string): AIProvider {
    switch (type) {
      case 'gemini':
        // A API Key é passada diretamente em vez de pegar do process.env internamente
        const provider = new GeminiProvider();
        provider.setDynamicConfig(apiKey, modelConfig);
        return provider;
      case 'openai':
        throw new Error('AIConfigurationError: OpenAI integration is supported by architecture but not yet implemented.');
      case 'runway':
        throw new Error('AIConfigurationError: Runway integration is supported by architecture but not yet implemented.');
      default:
        throw new Error(`AIConfigurationError: Provider type '${type}' is unknown.`);
    }
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
