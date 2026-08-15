-- Rollback for early access indexes migration
-- Removes ONLY the two indexes created by 20260815000000_early_access_indexes.sql
-- No other objects are touched

DROP INDEX IF EXISTS public.idx_invite_code_redemptions_invite_code_id;
DROP INDEX IF EXISTS public.idx_invite_codes_created_by;