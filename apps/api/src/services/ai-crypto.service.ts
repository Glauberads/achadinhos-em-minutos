import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const CURRENT_VERSION = 1;

export interface EncryptedEnvelope {
  version: number;
  algorithm: string;
  keyVersion: string;
  iv: string; // hex
  ciphertext: string; // hex
  authTag: string; // hex
}

export class AICryptoService {
  private encryptionKey: Buffer;

  constructor() {
    const rawKey = process.env.ENCRYPTION_KEY;

    if (!rawKey) {
      throw new Error('AICryptoService Configuration Error: ENCRYPTION_KEY is missing');
    }
    
    // Convert base64 to buffer
    this.encryptionKey = Buffer.from(rawKey, 'base64');
    
    if (this.encryptionKey.length !== 32) {
      throw new Error(`AICryptoService Configuration Error: ENCRYPTION_KEY must be exactly 32 bytes when decoded from base64. Got ${this.encryptionKey.length} bytes.`);
    }
  }

  /**
   * Criptografa um texto em claro usando AES-256-GCM.
   */
  public encrypt(plaintext: string): string {
    // 12 bytes é recomendado para GCM (96 bits)
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    const envelope: EncryptedEnvelope = {
      version: CURRENT_VERSION,
      algorithm: ALGORITHM,
      keyVersion: 'v1',
      iv: iv.toString('hex'),
      ciphertext,
      authTag,
    };

    return JSON.stringify(envelope);
  }

  /**
   * Descriptografa um envelope JSON.
   */
  public decrypt(envelopeJson: string): string {
    let envelope: EncryptedEnvelope;
    
    try {
      envelope = JSON.parse(envelopeJson);
    } catch (e) {
      throw new Error('AICryptoService Decryption Error: Malformed envelope (not valid JSON).');
    }

    if (envelope.version !== CURRENT_VERSION) {
      throw new Error(`AICryptoService Decryption Error: Unsupported version ${envelope.version}.`);
    }

    if (envelope.algorithm !== ALGORITHM) {
      throw new Error(`AICryptoService Decryption Error: Unsupported algorithm ${envelope.algorithm}.`);
    }

    if (!envelope.iv || !envelope.ciphertext || !envelope.authTag) {
      throw new Error('AICryptoService Decryption Error: Missing required envelope fields (iv, ciphertext, authTag).');
    }

    try {
      const ivBuffer = Buffer.from(envelope.iv, 'hex');
      const authTagBuffer = Buffer.from(envelope.authTag, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let plaintext = decipher.update(envelope.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error: any) {
      throw new Error(`AICryptoService Decryption Error: Integrity validation failed or incorrect key. Details: ${error.message}`);
    }
  }
}

export const aiCryptoService = new AICryptoService();
