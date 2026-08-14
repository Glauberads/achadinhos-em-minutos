import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

// Legacy compatibility: existing CBC ciphertext derives its 32-byte AES key by
// hashing the configured value. Keep that derivation until a dedicated CBC ->
// GCM data migration is approved, but never invent a fallback key.
const getLegacyKey = () => {
  const configuredKey = process.env.ENCRYPTION_KEY;

  if (!configuredKey) {
    throw new Error('Legacy crypto configuration error: ENCRYPTION_KEY is missing');
  }

  return crypto.createHash('sha256').update(configuredKey).digest();
};

export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getLegacyKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptSecret = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = getLegacyKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
};
