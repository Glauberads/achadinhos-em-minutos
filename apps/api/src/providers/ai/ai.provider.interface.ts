import { z } from 'zod';

export interface StructuredGenerationRequest<T> {
  prompt: string;
  schema: z.ZodType<T>;
  systemInstruction?: string;
  options?: {
    model?: string;
    image?: {
      mimeType: string;
      data: string; // base64
    };
  };
}

export interface AIProvider {
  /**
   * Envia um prompt para a IA e retorna a resposta formatada ou crua.
   */
  generateContent(prompt: string, options?: { 
    jsonMode?: boolean;
    image?: {
      mimeType: string;
      data: string; // base64
    }
  }): Promise<string>;

  /**
   * Envia um prompt estruturado para a IA garantindo que a resposta siga o esquema fornecido.
   */
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
}
