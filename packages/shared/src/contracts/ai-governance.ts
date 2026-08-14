import { z } from 'zod';

export const AICapabilitySchema = z.enum([
  'structured-generation',
  'text-generation',
  'image-generation',
  'video-generation',
]);

export type AICapability = z.infer<typeof AICapabilitySchema>;

export const AIProviderTypeSchema = z.enum(['gemini', 'openai', 'runway']);

export type AIProviderType = z.infer<typeof AIProviderTypeSchema>;

// ============================================
// DTOs for Write/Update (Inputs)
// ============================================

export const AIProviderCreateSchema = z.object({
  providerType: AIProviderTypeSchema,
  displayName: z.string().min(1),
  enabled: z.boolean().default(true),
  status: z.enum(['active', 'error', 'configuring']).default('active'),
});
export type AIProviderCreateDTO = z.infer<typeof AIProviderCreateSchema>;

export const AIProviderUpdateSchema = AIProviderCreateSchema.partial();
export type AIProviderUpdateDTO = z.infer<typeof AIProviderUpdateSchema>;

export const AIProviderModelCreateSchema = z.object({
  providerId: z.string().uuid(),
  modelKey: z.string().min(1),
  displayName: z.string().min(1),
  capabilities: z.array(AICapabilitySchema).default([]),
  enabled: z.boolean().default(true),
});
export type AIProviderModelCreateDTO = z.infer<typeof AIProviderModelCreateSchema>;

export const AIProviderModelUpdateSchema = AIProviderModelCreateSchema.partial().omit({ providerId: true });
export type AIProviderModelUpdateDTO = z.infer<typeof AIProviderModelUpdateSchema>;

// CredentialWrite DTO MUST NEVER be returned in GET requests
export const AIProviderCredentialWriteSchema = z.object({
  providerId: z.string().uuid(),
  apiKey: z.string().min(1),
});
export type AIProviderCredentialWriteDTO = z.infer<typeof AIProviderCredentialWriteSchema>;

export const AICapabilityRouteUpsertSchema = z.object({
  capability: AICapabilitySchema,
  primaryProviderId: z.string().uuid(),
  primaryModelId: z.string().uuid(), // using model ID for strong referential integrity
  fallbackProviderId: z.string().uuid().nullable().optional(),
  fallbackModelId: z.string().uuid().nullable().optional(),
  enabled: z.boolean().default(true),
});
export type AICapabilityRouteUpsertDTO = z.infer<typeof AICapabilityRouteUpsertSchema>;

// ============================================
// DTOs for Read (Responses)
// ============================================

// Administrative Provider Response (NEVER includes secrets)
export const AIProviderAdminResponseSchema = z.object({
  id: z.string().uuid(),
  providerType: AIProviderTypeSchema,
  displayName: z.string(),
  enabled: z.boolean(),
  status: z.string(),
  credentialConfigured: z.boolean(), // safe metadata instead of actual secret
  capabilities: z.array(AICapabilitySchema),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type AIProviderAdminResponseDTO = z.infer<typeof AIProviderAdminResponseSchema>;

export const AIProviderModelResponseSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid(),
  modelKey: z.string(),
  displayName: z.string(),
  capabilities: z.array(AICapabilitySchema),
  enabled: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type AIProviderModelResponseDTO = z.infer<typeof AIProviderModelResponseSchema>;

export const AICapabilityRouteResponseSchema = z.object({
  capability: AICapabilitySchema,
  primaryProviderId: z.string().uuid(),
  primaryModelId: z.string().uuid(),
  fallbackProviderId: z.string().uuid().nullable(),
  fallbackModelId: z.string().uuid().nullable(),
  enabled: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type AICapabilityRouteResponseDTO = z.infer<typeof AICapabilityRouteResponseSchema>;
