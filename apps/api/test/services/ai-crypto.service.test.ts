import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AICryptoService', () => {
  let AICryptoService: any;
  let aiCryptoService: any;

  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = 'dHzqKyyV12S+1f86DHgXQ9tqmS3L+xLEAUXFPgoqcGE='; // Valid 32-byte base64
    vi.resetModules();
    const module = await import('../../src/services/ai-crypto.service');
    AICryptoService = module.AICryptoService;
    aiCryptoService = module.aiCryptoService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criptografar e não vazar o texto original', () => {
    const plaintext = 'my-super-secret-api-key';
    const encrypted = aiCryptoService.encrypt(plaintext);
    
    expect(encrypted).not.toContain(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it('deve descriptografar corretamente', () => {
    const plaintext = 'another-secret-api-key-1234!';
    const encrypted = aiCryptoService.encrypt(plaintext);
    const decrypted = aiCryptoService.decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
  });

  it('deve falhar se houver tampering do ciphertext', () => {
    const plaintext = 'secret';
    const encrypted = aiCryptoService.encrypt(plaintext);
    const envelope = JSON.parse(encrypted);
    
    // Tamper with the ciphertext (change one hex character)
    const originalCiphertext = envelope.ciphertext;
    const modifiedHex = originalCiphertext.substring(0, originalCiphertext.length - 1) + (originalCiphertext.endsWith('a') ? 'b' : 'a');
    envelope.ciphertext = modifiedHex;
    
    expect(() => {
      aiCryptoService.decrypt(JSON.stringify(envelope));
    }).toThrow(/Integrity validation failed or incorrect key/);
  });

  it('deve falhar se houver tampering da authTag', () => {
    const plaintext = 'secret';
    const encrypted = aiCryptoService.encrypt(plaintext);
    const envelope = JSON.parse(encrypted);
    
    // Tamper with the authTag
    const originalTag = envelope.authTag;
    envelope.authTag = originalTag.substring(0, originalTag.length - 1) + (originalTag.endsWith('a') ? 'b' : 'a');
    
    expect(() => {
      aiCryptoService.decrypt(JSON.stringify(envelope));
    }).toThrow(/Integrity validation failed or incorrect key/);
  });

  it('deve falhar se chave for incorreta (simulando chave alterada)', async () => {
    const plaintext = 'secret';
    const encrypted = aiCryptoService.encrypt(plaintext);
    
    // Create a new instance with a different valid key
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_KEY = 'xHzqKyyV12S+1f86DHgXQ9tqmS3L+xLEAUXFPgoqcGE='; // Different 32-byte base64
    const otherCryptoService = new AICryptoService();
    
    expect(() => {
      otherCryptoService.decrypt(encrypted);
    }).toThrow(/Integrity validation failed or incorrect key/);
    
    process.env.NODE_ENV = originalEnv;
  });

  it('deve falhar para envelope malformado', () => {
    expect(() => {
      aiCryptoService.decrypt('not-a-json');
    }).toThrow(/Malformed envelope/);
  });

  it('deve falhar para versão não suportada', () => {
    const envelope = JSON.stringify({
      version: 999,
      algorithm: 'aes-256-gcm',
      keyVersion: 'v1',
      iv: '1234',
      ciphertext: '5678',
      authTag: '90ab'
    });
    
    expect(() => {
      aiCryptoService.decrypt(envelope);
    }).toThrow(/Unsupported version 999/);
  });

  it('deve validar tamanho exato da chave e formato (32 bytes em base64)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Missing key
    delete process.env.ENCRYPTION_KEY;
    expect(() => new AICryptoService()).toThrow(/ENCRYPTION_KEY is missing/);

    // Invalid base64 (still creates a buffer, but length won't be 32 or it won't decode properly)
    process.env.ENCRYPTION_KEY = 'this-is-not-base64!';
    expect(() => new AICryptoService()).toThrow(/must be exactly 32 bytes/);
    
    // 31 bytes (base64 encoded: length 31 = 44 chars with ==)
    // crypto.randomBytes(31).toString('base64') -> 'R0a/R8/5h4dO5mS8+n8x1Y2j1r4=' (not accurate length string, just fake it with a real generator result)
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012345678901w=='; // Decodes to 31 bytes
    expect(() => new AICryptoService()).toThrow(/must be exactly 32 bytes/);
    
    // 33 bytes
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012345678901234'; // Decodes to 33 bytes
    expect(() => new AICryptoService()).toThrow(/must be exactly 32 bytes/);
    
    // 32 bytes - PASS
    process.env.ENCRYPTION_KEY = 'dHzqKyyV12S+1f86DHgXQ9tqmS3L+xLEAUXFPgoqcGE=';
    expect(() => new AICryptoService()).not.toThrow();

    process.env.NODE_ENV = originalEnv;
  });
});
