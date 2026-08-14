import { AIProvider, StructuredGenerationRequest } from './ai.provider.interface';
import { AIResponseValidationError } from './ai-errors';

export interface MockProviderOptions {
  fixtures?: Record<string, any>;
}

export class MockProvider implements AIProvider {
  private options: MockProviderOptions;

  constructor(options: MockProviderOptions = {}) {
    this.options = options;
  }

  async generateContent(prompt: string, options?: { jsonMode?: boolean }): Promise<string> {
    console.log('[MockProvider] Generating content for prompt:', prompt.substring(0, 50) + '...');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (options?.jsonMode) {
      if (this.options.fixtures && this.options.fixtures['defaultJson']) {
        return JSON.stringify(this.options.fixtures['defaultJson']);
      }
      return JSON.stringify({ mocked: true });
    }

    if (this.options.fixtures && this.options.fixtures['defaultText']) {
      return this.options.fixtures['defaultText'];
    }

    return "Mocked response text generated successfully.";
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log('[MockProvider] Generating structured content for prompt:', request.prompt.substring(0, 50) + '...');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a test environment, the fixture can be injected based on operation or schema name.
    // For simplicity, we assume there's a fixture matched by the schema type or we just use 'structured'.
    // If no fixture is available, the mock might fail validation intentionally or we try to pass an empty object.
    const fixture = this.options.fixtures?.['structured'] || {};

    const result = request.schema.safeParse(fixture);

    if (!result.success) {
      throw new AIResponseValidationError(`Mock fixture validation failed: ${result.error.message}`, 'MockProvider', 'generateStructured');
    }

    return result.data;
  }
}
