# DB-1 production gate

These files prepare, but do not authorize or execute, the AI provider governance
migration.

## Versioning decision

`20260812000000_ai_provider_governance.sql` already existed in Git, but the
previous version was confirmed pending and its governance objects were absent
from the audited remote schema. DB-1 therefore hardens that same unapplied file
instead of adding a later corrective migration that would first require the
unsafe version to run. This decision does not authorize remote execution.

## Required sequence for the future execution gate

1. Create or verify a restorable Supabase database backup. In Dashboard →
   Database → Backups, confirm the latest daily backup or PITR restore point is
   newer than the final application write preceding the maintenance window.
   Record its identifier/time in UTC, retention, project ref, responsible
   operator, and the tested restore path. If the plan has no restorable managed
   backup, take an encrypted off-host logical backup with `supabase db dump` in
   three parts: roles (`--role-only`), schema (default), and data
   (`--data-only --use-copy`). Never commit dump files or connection strings.
2. Run `preflight.sql` in the Supabase SQL Editor. Continue only when the single
   classification row is `SAFE_TO_APPLY`. `PARTIAL_STATE` and `BLOCKED` require
   investigation; `ALREADY_APPLIED` means the migration must not be reapplied.
3. Review and run only
   `supabase/migrations/20260812000000_ai_provider_governance.sql`. The file owns
   its `BEGIN`/`COMMIT`, so do not wrap it in another transaction.
4. Run `postflight.sql`. Verify four RLS-enabled governance tables, zero policies,
   zero `anon`/`authenticated` grants, the protected trigger/function, and the
   expected constraints.
5. Do not bootstrap a Superadmin until a separate authorization identifies an
   `auth.users.id` with a matching `profiles.id`. Email is informational only.

## Rollback boundary

`rollback.sql` is only for immediate rollback before any provider, credential,
model, route, or `platform_role` data is written. It aborts when it detects such
data. After the feature starts being used, take a fresh backup/export and use a
forward corrective migration instead of dropping governance tables.

## Explicitly deferred migrations

- `20260702000000_add_asaas_schema.sql`: **PENDING / DEFERRED**. It is not a
  dependency of the AI governance/Superadmin schema.
- `20260702000001_feature_flag_creative_intelligence_v2.sql`: **BLOCKED**. It
  writes `feature_flags.is_enabled`, while the deployed schema and application
  contract use `feature_flags.enabled`. Fix it later with a separately reviewed
  migration; do not run it as part of DB-1.
