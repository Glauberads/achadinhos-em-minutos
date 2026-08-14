-- DB-1 immediate rollback (DO NOT RUN as postflight).
-- This rollback deliberately aborts if governance data or a platform role has
-- already been written. Once used, prefer a forward migration and data export.

BEGIN;

DO $rollback_guard$
DECLARE
  populated_table text;
  is_populated boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE platform_role IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'ROLLBACK BLOCKED: profiles.platform_role already contains data';
  END IF;

  FOREACH populated_table IN ARRAY ARRAY[
    'ai_capability_routes',
    'ai_provider_credentials',
    'ai_provider_models',
    'ai_providers'
  ]
  LOOP
    IF to_regclass(format('public.%I', populated_table)) IS NOT NULL THEN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I)',
        'public',
        populated_table
      ) INTO is_populated;

      IF is_populated THEN
        RAISE EXCEPTION 'ROLLBACK BLOCKED: table public.% contains data', populated_table;
      END IF;
    END IF;
  END LOOP;
END;
$rollback_guard$;

DROP TABLE IF EXISTS public.ai_capability_routes;
DROP TABLE IF EXISTS public.ai_provider_credentials;
DROP TABLE IF EXISTS public.ai_provider_models;
DROP TABLE IF EXISTS public.ai_providers;

DROP TRIGGER IF EXISTS protect_platform_role_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_platform_role();

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_platform_role;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS platform_role;

COMMIT;
