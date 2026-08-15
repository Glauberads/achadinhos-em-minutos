# Early Access Indexes Migration Review

## Overview
This directory contains review artifacts for the forward-only index migration `20260815000000_early_access_indexes.sql` which addresses two FK performance tech debt items identified during EA-3.2 reconciliation:

1. `public.invite_code_redemptions(invite_code_id)` - FK to `invite_codes(id)`
2. `public.invite_codes(created_by)` - FK to `profiles(id)`

## Files

### preflight.sql
Read-only classification of remote database state:
- **SAFE_TO_APPLY**: Neither index exists
- **ALREADY_APPLIED**: Both indexes exist with correct columns
- **PARTIAL_STATE**: One index exists, one missing
- **BLOCKED**: Unexpected state (e.g., index exists on wrong column)

### postflight.sql
Read-only validation that both indexes exist with correct columns:
- Returns `POSTFLIGHT_PASS` only if both indexes are present and correct
- Returns `POSTFLIGHT_FAIL` otherwise

### rollback.sql
Removes ONLY the two indexes created by this migration:
- `DROP INDEX IF EXISTS public.idx_invite_code_redemptions_invite_code_id;`
- `DROP INDEX IF EXISTS public.idx_invite_codes_created_by;`

No other database objects are modified.

## Migration Properties
- **Forward-only**: No DOWN migration, no DROP in forward direction
- **Idempotent**: Uses `CREATE INDEX IF NOT EXISTS`
- **No DML**: No data manipulation
- **No DROP**: No dropping of existing objects in forward direction
- **No policy/RLS changes**: Pure index creation
- **No AI Governance impact**: Does not touch AI Governance tables
- **No EA-1 impact**: Does not modify Early Access Security tables beyond adding indexes

## Execution Order
1. Run `preflight.sql` → confirm `SAFE_TO_APPLY` or `ALREADY_APPLIED`
2. Apply migration `20260815000000_early_access_indexes.sql`
3. Run `postflight.sql` → confirm `POSTFLIGHT_PASS`
4. If rollback needed: run `rollback.sql`

## Security
- Zero secrets in any file
- No DATABASE_URL
- No service_role references
- No .env files tracked