import { describe, expect, it } from 'vitest';
import { parseAllowedOrigins } from '../../src/lib/cors';

describe('CORS origin contract', () => {
  it('parses, trims, and deduplicates configured origins', () => {
    expect(parseAllowedOrigins(' https://app.achadinhos.builderfy.com.br,https://example.test,https://example.test ')).toEqual([
      'https://app.achadinhos.builderfy.com.br',
      'https://example.test',
    ]);
  });

  it('rejects wildcard origins because credentialed requests are enabled', () => {
    expect(() => parseAllowedOrigins('*')).toThrow(/wildcard origins are forbidden/);
  });

  it('uses development-only defaults when CORS_ORIGINS is absent', () => {
    expect(parseAllowedOrigins()).toEqual([
      'http://localhost:5173',
      'http://localhost:3000',
    ]);
  });
});
