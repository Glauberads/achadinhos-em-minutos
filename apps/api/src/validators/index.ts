import { z } from 'zod';

/**
 * Validators centralizados usando Zod.
 * 
 * Cada schema valida o body de um endpoint específico.
 * Garante tipagem segura e elimina `as any` das rotas.
 * 
 * Zod já estava instalado no package.json mas nunca utilizado.
 */

// ============================
// Telegram
// ============================

export const telegramConnectSchema = z.object({
  bot_token: z.string().min(10, 'Token do bot é obrigatório'),
  chat_id: z.string().min(1, 'Chat ID é obrigatório'),
  group_name: z.string().optional().default('Meu Canal'),
});
export type TelegramConnectInput = z.infer<typeof telegramConnectSchema>;

export const telegramTestSendSchema = z.object({
  product_id: z.string().uuid('ID do produto inválido'),
  group_id: z.string().uuid('ID do grupo inválido'),
});
export type TelegramTestSendInput = z.infer<typeof telegramTestSendSchema>;

// ============================
// Products
// ============================

export const productSearchSchema = z.object({
  platform: z.enum(['shopee', 'mercadolivre'], { 
    errorMap: () => ({ message: 'Platform must be shopee or mercadolivre' }) 
  }),
  keyword: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});
export type ProductSearchInput = z.infer<typeof productSearchSchema>;

export const productImportSchema = z.object({
  products: z.array(z.object({
    platform: z.enum(['shopee', 'mercadolivre']),
    external_id: z.string(),
    title: z.string(),
    original_price: z.number().nullable(),
    current_price: z.number(),
    discount: z.number().nullable(),
    image_url: z.string().nullable(),
    source_url: z.string(),
    affiliate_link: z.string().nullable(),
    rating: z.number().nullable().optional(),
    sold_count: z.number().nullable().optional(),
    category: z.string().nullable().optional(),
    free_shipping: z.boolean().optional().default(false),
    metadata: z.record(z.any()).optional().default({}),
  })).min(1, 'É necessário pelo menos 1 produto'),
  job_id: z.string().uuid().optional(),
});
export type ProductImportInput = z.infer<typeof productImportSchema>;

// ============================
// Campaigns
// ============================

export const campaignCreateSchema = z.object({
  name: z.string().min(2, 'Nome da campanha é obrigatório'),
  platform: z.enum(['shopee', 'mercadolivre', 'both']),
  keyword: z.string().optional(),
  category: z.string().optional(),
  filters: z.record(z.any()).optional().default({}),
  telegram_group_id: z.string().uuid('ID do grupo inválido'),
  recurrence_cron: z.string().min(1, 'Recorrência é obrigatória'),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  keyword: z.string().optional(),
  category: z.string().optional(),
  filters: z.record(z.any()).optional(),
  telegram_group_id: z.string().uuid().optional(),
  recurrence_cron: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'failed']).optional(),
});
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

// ============================
// Marketplaces
// ============================

export const marketplaceConfigSchema = z.object({
  platform: z.enum(['shopee', 'mercadolivre'], {
    errorMap: () => ({ message: 'Plataforma inválida' })
  }),
  app_id: z.string().optional(),
  app_secret: z.string().optional(),
  affiliate_id: z.string().optional(),
});
export type MarketplaceConfigInput = z.infer<typeof marketplaceConfigSchema>;

export const marketplaceTestSchema = z.object({
  platform: z.enum(['shopee', 'mercadolivre']),
});

// ============================
// Paginação Reutilizável
// ============================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================
// UUID Params Reutilizável
// ============================

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});
export type IdParam = z.infer<typeof idParamSchema>;

/**
 * Helper para validar body de request com um schema Zod.
 * Retorna os dados tipados ou lança erro 400 com detalhes.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const error = new Error('Validation failed') as any;
    error.statusCode = 400;
    error.validation = errors;
    throw error;
  }
  return result.data;
}

/**
 * Helper para validar params de request.
 */
export function validateParams<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return validateBody(schema, data);
}

/**
 * Helper para validar query string.
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return validateBody(schema, data);
}
