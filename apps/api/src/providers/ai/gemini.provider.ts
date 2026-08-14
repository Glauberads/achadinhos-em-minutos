import { AIProvider, StructuredGenerationRequest } from './ai.provider.interface';
import { AIProviderError, AIResponseValidationError, AIConfigurationError } from './ai-errors';
import { toGeminiResponseSchema } from './gemini-schema-adapter';
import { z } from 'zod';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.defaultModel = 'gemini-1.5-flash';
  }

  public setDynamicConfig(apiKey: string, modelConfig?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
    if (modelConfig) {
      this.defaultModel = modelConfig;
    }
  }

  private getHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async generateContent(prompt: string, options?: { 
    jsonMode?: boolean;
    image?: {
      mimeType: string;
      data: string;
    }
  }): Promise<string> {
    if (!this.apiKey) {
      throw new AIConfigurationError('GEMINI_API_KEY not configured', 'Gemini');
    }

    const parts: any[] = [{ text: prompt }];

    if (options?.image) {
      parts.unshift({
        inlineData: {
          mimeType: options.image.mimeType,
          data: options.image.data
        }
      });
    }

    const payload: any = {
      contents: [{ parts }],
    };

    if (options?.jsonMode) {
      payload.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new AIProviderError(`Gemini API Error: ${errText}`, 'Gemini');
    }

    const data = await response.json() as GeminiGenerateResponse;
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new AIProviderError('Invalid response from Gemini', 'Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    if (!this.apiKey) {
      throw new AIConfigurationError('GEMINI_API_KEY not configured', 'Gemini', 'generateStructured');
    }

    const parts: any[] = [{ text: request.prompt }];
    
    if (request.options?.image) {
      parts.unshift({
        inlineData: {
          mimeType: request.options.image.mimeType,
          data: request.options.image.data
        }
      });
    }

    const payload: any = {
      contents: [{ parts }],
    };

    if (request.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: request.systemInstruction }]
      };
    }

    const geminiSchema = toGeminiResponseSchema(request.schema);

    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: geminiSchema
    };

    const model = request.options?.model || this.defaultModel;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new AIProviderError(`Gemini API Error: ${errText}`, 'Gemini', 'generateStructured');
    }

    const data = await response.json() as GeminiGenerateResponse;
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new AIProviderError('Invalid response from Gemini', 'Gemini', 'generateStructured');
    }

    const textOutput = data.candidates[0].content.parts[0].text;
    
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(textOutput);
    } catch (err: any) {
      throw new AIResponseValidationError(`Failed to parse JSON response: ${err.message}`, 'Gemini', 'generateStructured');
    }

    const result = request.schema.safeParse(parsedJson);

    if (!result.success) {
      throw new AIResponseValidationError(`Response validation failed: ${result.error.message}`, 'Gemini', 'generateStructured');
    }

    return result.data;
  }
}
