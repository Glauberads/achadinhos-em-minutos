-- EA-1 controlled immediate rollback (DO NOT RUN as postflight).
-- This removes unused acquisition/redemption structures only. Security
-- hardening on profiles.access_status and invite_codes is deliberately retained:
-- rollback must never restore public invite listing or client profile UPDATE.

BEGIN;

DO $rollback_guard$
DECLARE
  application_count bigint := 0;
  redemption_count bigint := 0;
BEGIN
  IF to_regclass('public.early_access_applications') IS NOT NULL THEN
    SELECT count(*)
    INTO application_count
    FROM public.early_access_applications;
  END IF;

  IF to_regclass('public.invite_code_redemptions') IS NOT NULL THEN
    SELECT count(*)
    INTO redemption_count
    FROM public.invite_code_redemptions;
  END IF;

  IF application_count > 0 OR redemption_count > 0 THEN
    RAISE EXCEPTION
      'ROLLBACK BLOCKED: EA-1 contains application/redemption data (% applications, % redemptions)',
      application_count,
      redemption_count;
  END IF;
END;
$rollback_guard$;

DROP FUNCTION IF EXISTS public.redeem_early_access_invite(text, uuid);

DROP TABLE IF EXISTS public.invite_code_redemptions;

DROP TRIGGER IF EXISTS prepare_early_access_application_trigger
  ON public.early_access_applications;
DROP FUNCTION IF EXISTS public.prepare_early_access_application();
DROP TABLE IF EXISTS public.early_access_applications;

-- Intentionally retained:
--   protect_access_status() / protect_access_status_trigger
--   restricted profiles UPDATE grants/policies
--   restricted invite_codes grants/policies
--   invite integrity constraints
-- These controls close pre-existing privilege-escalation/data-exposure risks.

COMMIT;
