import { z } from 'zod';

export const EarlyAccessApplicationStatusSchema = z.enum([
  'WAITLIST',
  'INVITED',
  'APPROVED',
  'REJECTED',
]);
export type EarlyAccessApplicationStatus = z.infer<
  typeof EarlyAccessApplicationStatusSchema
>;

export const AccessStateSchema = z.enum([
  'WAITLIST',
  'INVITED',
  'BETA_TESTER',
  'ACTIVE',
  'SUSPENDED',
  'BANNED',
]);
export type AccessState = z.infer<typeof AccessStateSchema>;

const OptionalTrackingValueSchema = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional();

export const EarlyAccessApplicationCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  primaryGoal: z.string().trim().max(1000).nullable().optional(),
  source: OptionalTrackingValueSchema,
  utmSource: OptionalTrackingValueSchema,
  utmMedium: OptionalTrackingValueSchema,
  utmCampaign: OptionalTrackingValueSchema,
  utmContent: OptionalTrackingValueSchema,
  utmTerm: OptionalTrackingValueSchema,
});
export type EarlyAccessApplicationCreate = z.infer<
  typeof EarlyAccessApplicationCreateSchema
>;

export const InviteRedeemRequestSchema = z.object({
  code: z.string().trim().min(1).max(255),
});
export type InviteRedeemRequest = z.infer<typeof InviteRedeemRequestSchema>;

export const PlatformRoleSchema = z.enum(['superadmin']);

export const MeAccessResponseSchema = z
  .object({
    authenticated: z.boolean(),
    accessStatus: AccessStateSchema.nullable(),
    subscriptionStatus: z.string().nullable(),
    role: z.string().nullable(),
    platformRole: PlatformRoleSchema.nullable(),
  })
  .superRefine((value, context) => {
    if (
      !value.authenticated
      && (
        value.accessStatus !== null
        || value.subscriptionStatus !== null
        || value.role !== null
        || value.platformRole !== null
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unauthenticated access responses must not expose profile state',
      });
    }
  });
export type MeAccessResponse = z.infer<typeof MeAccessResponseSchema>;

