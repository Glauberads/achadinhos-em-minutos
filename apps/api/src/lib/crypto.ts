import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'minha_chave_secreta_provisoria_12345';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

// Garante que a chave tenha 32 bytes para o AES-256
const getValidatedKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getValidatedKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptSecret = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = getValidatedKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
};
