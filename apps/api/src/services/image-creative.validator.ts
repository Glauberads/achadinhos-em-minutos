import { z } from 'zod';

export const generateImageCreativeSchema = z.object({
  product_url: z.string().url('A URL fornecida é inválida'),
  format: z.enum(['story', 'feed']).default('story'),
  style: z.string().default('Oferta Relâmpago')
});
