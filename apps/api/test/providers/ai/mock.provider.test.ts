import { describe, it, expect } from 'vitest';
import { MockProvider } from '../../../src/providers/ai/mock.provider';
import { creativeIntelligenceOutputSchema } from '../../../src/validators/creative-os.validator';
import { AIResponseValidationError } from '../../../src/providers/ai/ai-errors';

describe('MockProvider', () => {
  it('should generate text content', async () => {
    const provider = new MockProvider({ fixtures: { defaultText: 'Hello' } });
    const result = await provider.generateContent('test');
    expect(result).toBe('Hello');
  });

  it('should generate structured content for a valid fixture', async () => {
    const validFixture = {
      bestPractices: ['Valid test'],
      bannedWords: []
    };
    const provider = new MockProvider({ fixtures: { structured: validFixture } });
    
    const result = await provider.generateStructured({
      prompt: 'test',
      schema: creativeIntelligenceOutputSchema
    });

    expect(result.bestPractices).toEqual(['Valid test']);
  });

  it('should fail structured generation for an invalid fixture', async () => {
    const invalidFixture = {
      bestPractices: 'Not an array',
      bannedWords: []
    };
    const provider = new MockProvider({ fixtures: { structured: invalidFixture } });
    
    await expect(provider.generateStructured({
      prompt: 'test',
      schema: creativeIntelligenceOutputSchema
    })).rejects.toThrow(AIResponseValidationError);
  });
});
