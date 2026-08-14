import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiProvider } from '../../../src/providers/ai/gemini.provider';
import { AIConfigurationError, AIProviderError, AIResponseValidationError } from '../../../src/providers/ai/ai-errors';
import { z } from 'zod';

const testSchema = z.object({
  result: z.string(),
  score: z.number()
});

describe('GeminiProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should throw AIConfigurationError if GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiProvider();
    
    await expect(provider.generateStructured({
      prompt: 'test',
      schema: testSchema
    })).rejects.toThrow(AIConfigurationError);
  });

  it('should pass and return valid data if response is correctly formatted', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"result":"success","score":100}' }]
          }
        }]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new GeminiProvider();
    const data = await provider.generateStructured({
      prompt: 'test',
      schema: testSchema
    });

    expect(data.result).toBe('success');
    expect(data.score).toBe(100);
  });

  it('should throw AIResponseValidationError if the output JSON is malformed', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"result":"success", malformed json}' }]
          }
        }]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new GeminiProvider();
    await expect(provider.generateStructured({
      prompt: 'test',
      schema: testSchema
    })).rejects.toThrow(AIResponseValidationError);
  });

  it('should throw AIResponseValidationError if the output JSON is valid but does not match schema', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"result":"success","score":"not_a_number"}' }]
          }
        }]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new GeminiProvider();
    await expect(provider.generateStructured({
      prompt: 'test',
      schema: testSchema
    })).rejects.toThrow(AIResponseValidationError);
  });

  it('should throw AIProviderError on network failure', async () => {
    const mockResponse = {
      ok: false,
      text: async () => 'API limit exceeded'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const provider = new GeminiProvider();
    await expect(provider.generateStructured({
      prompt: 'test',
      schema: testSchema
    })).rejects.toThrow(AIProviderError);
  });
});
