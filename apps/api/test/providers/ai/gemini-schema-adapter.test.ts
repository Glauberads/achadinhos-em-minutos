import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { toGeminiResponseSchema } from '../../../src/providers/ai/gemini-schema-adapter';

describe('toGeminiResponseSchema', () => {
  it('should remove $schema and additionalProperties', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const geminiSchema = toGeminiResponseSchema(schema);

    expect(geminiSchema).not.toHaveProperty('$schema');
    expect(geminiSchema).not.toHaveProperty('additionalProperties');
    expect(geminiSchema.type).toBe('object');
    expect(geminiSchema.properties.name.type).toBe('string');
  });

  it('should remove default and const properties in nested objects', () => {
    const schema = z.object({
      version: z.literal('v2'),
      config: z.object({
        isActive: z.boolean().default(true)
      })
    });

    const geminiSchema = toGeminiResponseSchema(schema);

    expect(geminiSchema.properties.version).not.toHaveProperty('const');
    expect(geminiSchema.properties.config.properties.isActive).not.toHaveProperty('default');
  });
});
