# EA-1 database review gate

No file in this directory authorizes production execution.

## Future execution order

1. Verify a restorable backup/PITR point and record project ref plus UTC time.
2. Run `preflight.sql`; continue only on `SAFE_TO_APPLY`.
3. Review and apply only
   `20260814000000_early_access_security.sql` in a separately authorized gate.
4. Run `postflight.sql`; require `POSTFLIGHT_PASS`.
5. Run `security-tests.sql` only on a disposable test database, never production.

`local-fixture.sql` creates a minimal Supabase-like legacy schema for isolated
PostgreSQL validation. It is destructive to an existing schema and therefore
must only be used in a newly created disposable database.

## Concurrency test

The redeem function locks the selected invite row with `FOR UPDATE`. Verify the
final-use race on a disposable database with two independent sessions:

1. Create one invite with `max_uses = 1`, `current_uses = 0` and two test profiles.
2. Begin a transaction in session A and call `redeem_early_access_invite` for
   profile A without committing immediately.
3. Call the same function for profile B in session B. It must wait on the row.
4. Commit session A.
5. Session B must resume and fail with `invite code exhausted` (`22023`).
6. Verify exactly one redemption row, `current_uses = 1`, and only profile A
   received the target access state.

This two-session test was designed to prove the database lock, not application
timing. Never weaken it to a read-then-update sequence in API code.

## Rollback boundary

`rollback.sql` aborts when applications or redemptions exist. It removes only
unused acquisition/redemption structures. The pre-existing security fixes on
profiles and invite codes remain intentionally in force; a rollback must not
restore public invite listing or direct client profile updates.
