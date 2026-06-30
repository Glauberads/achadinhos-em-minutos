import { z } from 'zod';

export const generateCreativeSchema = z.object({
  product_url: z.string().url('A URL fornecida deve ser válida').refine(url => {
    const u = new URL(url);
    return u.hostname.includes('shopee') || u.hostname.includes('mercadolivre');
  }, 'Apenas links do Mercado Livre ou Shopee são permitidos'),
  style: z.enum(['Oferta Relâmpago', 'Premium Minimalista', 'Achadinho Viral', 'Urgência Máxima']).default('Oferta Relâmpago')
});

export const updateCreativeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  script: z.any().optional(),
  scenes: z.any().optional()
});

export type GenerateCreativeDTO = z.infer<typeof generateCreativeSchema>;
export type UpdateCreativeDTO = z.infer<typeof updateCreativeSchema>;
