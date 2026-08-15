import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migrationPath = fileURLToPath(new URL(
  '../../../../supabase/migrations/20260814000000_early_access_security.sql',
  import.meta.url,
));
const migration = readFileSync(migrationPath, 'utf8');
const reviewRoot = new URL('../../../../supabase/review/early-access/', import.meta.url);
const preflight = readFileSync(new URL('preflight.sql', reviewRoot), 'utf8');
const postflight = readFileSync(new URL('postflight.sql', reviewRoot), 'utf8');
const rollback = readFileSync(new URL('rollback.sql', reviewRoot), 'utf8');

const executableMutation = /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|CALL|DO)\b/im;

describe('EA-1 database security contract', () => {
  it('is transactional and does not modify platform_role', () => {
    expect(migration).toMatch(/^BEGIN;$/m);
    expect(migration).toMatch(/^COMMIT;$/m);
    expect(migration).not.toMatch(/ALTER\s+(?:TABLE\s+public\.profiles\s+)?(?:COLUMN\s+)?platform_role/i);
  });

  it('fails closed when an untrusted client changes access_status', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.protect_access_status()');
    expect(migration).toContain("request_role = 'service_role'");
    expect(migration).toContain("ERRCODE = '42501'");
    expect(migration).toContain('BEFORE UPDATE OF access_status');
    expect(migration).toContain(
      'REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated',
    );
  });

  it('keeps applications and invite data server-only', () => {
    for (const table of [
      'early_access_applications',
      'invite_codes',
      'invite_code_redemptions',
    ]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.early_access_applications FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.invite_codes FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.invite_code_redemptions FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain('DROP POLICY IF EXISTS "Anyone can read invite codes to validate"');
  });

  it('restricts invite redemption to trusted server execution', () => {
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.redeem_early_access_invite(text, uuid)',
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.redeem_early_access_invite(text, uuid)',
    );
    expect(migration).toContain('TO service_role');
  });

  it('rejects expired and exhausted invites', () => {
    expect(migration).toContain('selected_invite.expires_at <= now()');
    expect(migration).toContain('invite code expired');
    expect(migration).toContain(
      'selected_invite.current_uses >= selected_invite.max_uses',
    );
    expect(migration).toContain('invite code exhausted');
  });

  it('serializes final-use redemption and records each user once', () => {
    const lockPosition = migration.indexOf('FOR UPDATE;');
    const incrementPosition = migration.indexOf('SET current_uses = current_uses + 1');
    const profilePosition = migration.indexOf('SET access_status = selected_invite.target_role');
    const redemptionPosition = migration.indexOf('INSERT INTO public.invite_code_redemptions');

    expect(lockPosition).toBeGreaterThan(-1);
    expect(incrementPosition).toBeGreaterThan(lockPosition);
    expect(profilePosition).toBeGreaterThan(incrementPosition);
    expect(redemptionPosition).toBeGreaterThan(profilePosition);
    expect(migration).toContain('UNIQUE (invite_code_id, user_id)');
  });

  it('keeps preflight and postflight strictly read-only', () => {
    expect(preflight).not.toMatch(executableMutation);
    expect(postflight).not.toMatch(executableMutation);
    expect(preflight).toContain("THEN 'SAFE_TO_APPLY'");
    expect(preflight).toContain("THEN 'ALREADY_APPLIED'");
    expect(preflight).toContain("THEN 'BLOCKED'");
    expect(preflight).toContain("ELSE 'PARTIAL_STATE'");
    expect(postflight).toContain("THEN 'POSTFLIGHT_PASS'");
  });

  it('blocks rollback after applications or redemptions exist', () => {
    expect(rollback).toMatch(/^BEGIN;$/m);
    expect(rollback).toMatch(/^COMMIT;$/m);
    expect(rollback).toContain('application_count > 0 OR redemption_count > 0');
    expect(rollback).toContain('ROLLBACK BLOCKED');
    expect(rollback).not.toContain('CREATE POLICY "Anyone can read invite codes to validate"');
  });
});
