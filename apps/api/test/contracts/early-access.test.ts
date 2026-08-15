import { describe, expect, it } from 'vitest';
import {
  AccessStateSchema,
  EarlyAccessApplicationCreateSchema,
  EarlyAccessApplicationStatusSchema,
  InviteRedeemRequestSchema,
  MeAccessResponseSchema,
} from '../../../../packages/shared/src/contracts/early-access';

describe('Early Access shared contracts', () => {
  it('accepts the four application workflow states', () => {
    for (const status of ['WAITLIST', 'INVITED', 'APPROVED', 'REJECTED']) {
      expect(EarlyAccessApplicationStatusSchema.safeParse(status).success).toBe(true);
    }
    expect(EarlyAccessApplicationStatusSchema.safeParse('ACTIVE').success).toBe(false);
  });

  it('keeps application and platform access states separate', () => {
    for (const status of [
      'WAITLIST',
      'INVITED',
      'BETA_TESTER',
      'ACTIVE',
      'SUSPENDED',
      'BANNED',
    ]) {
      expect(AccessStateSchema.safeParse(status).success).toBe(true);
    }
    expect(AccessStateSchema.safeParse('APPROVED').success).toBe(false);
    expect(AccessStateSchema.safeParse('ADMIN').success).toBe(false);
  });

  it('normalizes user-entered application fields at the contract boundary', () => {
    const result = EarlyAccessApplicationCreateSchema.parse({
      name: '  Maria Silva  ',
      email: '  maria@example.com  ',
      primaryGoal: '  Criar campanhas  ',
      utmSource: '  landing  ',
    });

    expect(result).toMatchObject({
      name: 'Maria Silva',
      email: 'maria@example.com',
      primaryGoal: 'Criar campanhas',
      utmSource: 'landing',
    });
  });

  it('rejects invalid application and invite payloads', () => {
    expect(EarlyAccessApplicationCreateSchema.safeParse({
      name: '',
      email: 'not-an-email',
    }).success).toBe(false);
    expect(InviteRedeemRequestSchema.safeParse({ code: '   ' }).success).toBe(false);
  });

  it('accepts an authenticated access response with separated authorities', () => {
    expect(MeAccessResponseSchema.safeParse({
      authenticated: true,
      accessStatus: 'BETA_TESTER',
      subscriptionStatus: 'pending',
      role: 'member',
      platformRole: null,
    }).success).toBe(true);
  });

  it('does not expose profile state in unauthenticated responses', () => {
    expect(MeAccessResponseSchema.safeParse({
      authenticated: false,
      accessStatus: null,
      subscriptionStatus: null,
      role: null,
      platformRole: null,
    }).success).toBe(true);

    expect(MeAccessResponseSchema.safeParse({
      authenticated: false,
      accessStatus: 'WAITLIST',
      subscriptionStatus: null,
      role: null,
      platformRole: null,
    }).success).toBe(false);
  });
});
