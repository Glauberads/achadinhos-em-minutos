import { AIProvider } from './ai.provider.interface';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';
import { AIConfigurationError } from './ai-errors';

export class AIFactory {
  static getProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER || 'gemini';
    const isProd = process.env.NODE_ENV === 'production';
    
    if (provider === 'gemini') {
      if (process.env.GEMINI_API_KEY) {
        return new GeminiProvider();
      } else {
        if (isProd) {
          throw new AIConfigurationError('GEMINI_API_KEY is missing in production environment. Cannot fallback to MockProvider.', 'Gemini', 'init');
        }
        console.warn('GEMINI_API_KEY is not set. Falling back to MockProvider in non-production environment.');
        return new MockProvider();
      }
    }
    
    if (provider === 'mock') {
      return new MockProvider();
    }
    
    if (isProd) {
      throw new AIConfigurationError(`Provider ${provider} not recognized or configured in production.`, provider, 'init');
    }

    console.warn(`Provider ${provider} not recognized or configured. Falling back to MockProvider.`);
    return new MockProvider();
  }
}

class LazyAIProvider implements AIProvider {
  private instance: AIProvider | null = null;
  private getProvider() {
    if (!this.instance) {
      this.instance = AIFactory.getProvider();
    }
    return this.instance;
  }

  async generateContent(prompt: string, options?: any): Promise<string> {
    return this.getProvider().generateContent(prompt, options);
  }

  async generateStructured<T>(options: { prompt: string; schema: any; systemInstruction?: string; options?: any }): Promise<T> {
    return this.getProvider().generateStructured(options);
  }
}

export const aiProvider = new LazyAIProvider();
