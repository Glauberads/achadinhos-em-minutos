import { AIProvider } from './ai.provider.interface';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';

export class AIFactory {
  static getProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER || 'gemini';
    
    // In local development or if key is missing and provider is not forced to something else,
    // we can fallback to MockProvider. But let's respect the env var.
    
    if (provider === 'gemini') {
      if (process.env.GEMINI_API_KEY) {
        return new GeminiProvider();
      } else {
        console.warn('GEMINI_API_KEY is not set. Falling back to MockProvider.');
        return new MockProvider();
      }
    }
    
    // Extensible for future providers like OpenAIProvider
    // if (provider === 'openai') return new OpenAIProvider();

    console.warn(`Provider ${provider} not recognized or configured. Falling back to MockProvider.`);
    return new MockProvider();
  }
}

export const aiProvider = AIFactory.getProvider();
