import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '../../src/lib/crypto';

describe('legacy AES-256-CBC crypto', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'local-test-key-not-a-production-secret';
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it('fails explicitly when ENCRYPTION_KEY is missing', () => {
    delete process.env.ENCRYPTION_KEY;

    expect(() => encryptSecret('sensitive value')).toThrow(/ENCRYPTION_KEY is missing/);
  });

  it('round-trips legacy CBC ciphertext with the configured key', () => {
    const ciphertext = encryptSecret('legacy payload');

    expect(decryptSecret(ciphertext)).toBe('legacy payload');
  });

  it('decrypts ciphertext produced by the historical CBC key derivation', () => {
    const iv = Buffer.alloc(16, 7);
    const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY!).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update('existing data', 'utf8'), cipher.final()]);
    const historicalCiphertext = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

    expect(decryptSecret(historicalCiphertext)).toBe('existing data');
  });
});
