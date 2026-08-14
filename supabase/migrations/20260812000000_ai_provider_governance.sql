-- Migration: 20260812000000_ai_provider_governance.sql
-- Scope: platform superadmin role and server-only AI provider governance.
-- This migration is intentionally transactional and fail-closed on partial state.

BEGIN;

DO $migration_guard$
DECLARE
  governance_table_count integer;
  expected_column_count integer;
  expected_constraint_count integer;
  route_index_count integer;
  rls_table_count integer;
  policy_count integer;
  client_grant_count integer;
  service_grant_count integer;
  has_platform_role boolean;
  has_platform_role_contract boolean;
  has_platform_role_constraint_contract boolean;
  has_function boolean;
  has_function_contract boolean;
  has_trigger boolean;
  has_trigger_contract boolean;
  has_any_object boolean;
  has_complete_object_set boolean;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'BLOCKED: required table public.profiles does not exist';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'platform_role'
  ) INTO has_platform_role;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'platform_role'
      AND data_type = 'text'
      AND is_nullable = 'YES'
      AND column_default IS NULL
  ) INTO has_platform_role_contract;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint con
    WHERE con.conrelid = 'public.profiles'::regclass
      AND con.conname = 'chk_platform_role'
      AND con.contype = 'c'
      AND con.convalidated
      AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role IS NULL%'
      AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role = ''superadmin''::text%'
  ) INTO has_platform_role_constraint_contract;

  SELECT count(*)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
  INTO governance_table_count;

  SELECT count(*)
  FROM (VALUES
    ('ai_providers', 'id', 'uuid', 'NO', 'gen_random_uuid()'),
    ('ai_providers', 'provider_type', 'text', 'NO', NULL),
    ('ai_providers', 'display_name', 'text', 'NO', NULL),
    ('ai_providers', 'enabled', 'bool', 'NO', 'true'),
    ('ai_providers', 'status', 'text', 'NO', '''active''::text'),
    ('ai_providers', 'created_at', 'timestamptz', 'NO', 'now()'),
    ('ai_providers', 'updated_at', 'timestamptz', 'NO', 'now()'),
    ('ai_provider_credentials', 'id', 'uuid', 'NO', 'gen_random_uuid()'),
    ('ai_provider_credentials', 'provider_id', 'uuid', 'NO', NULL),
    ('ai_provider_credentials', 'encrypted_payload', 'text', 'NO', NULL),
    ('ai_provider_credentials', 'key_version', 'text', 'NO', '''1''::text'),
    ('ai_provider_credentials', 'created_at', 'timestamptz', 'NO', 'now()'),
    ('ai_provider_credentials', 'updated_at', 'timestamptz', 'NO', 'now()'),
    ('ai_provider_models', 'id', 'uuid', 'NO', 'gen_random_uuid()'),
    ('ai_provider_models', 'provider_id', 'uuid', 'NO', NULL),
    ('ai_provider_models', 'model_key', 'text', 'NO', NULL),
    ('ai_provider_models', 'display_name', 'text', 'NO', NULL),
    ('ai_provider_models', 'capabilities', '_text', 'NO', '''{}''::text[]'),
    ('ai_provider_models', 'enabled', 'bool', 'NO', 'true'),
    ('ai_provider_models', 'created_at', 'timestamptz', 'NO', 'now()'),
    ('ai_provider_models', 'updated_at', 'timestamptz', 'NO', 'now()'),
    ('ai_capability_routes', 'capability', 'text', 'NO', NULL),
    ('ai_capability_routes', 'primary_provider_id', 'uuid', 'NO', NULL),
    ('ai_capability_routes', 'primary_model_id', 'uuid', 'NO', NULL),
    ('ai_capability_routes', 'fallback_provider_id', 'uuid', 'YES', NULL),
    ('ai_capability_routes', 'fallback_model_id', 'uuid', 'YES', NULL),
    ('ai_capability_routes', 'enabled', 'bool', 'NO', 'true'),
    ('ai_capability_routes', 'created_at', 'timestamptz', 'NO', 'now()'),
    ('ai_capability_routes', 'updated_at', 'timestamptz', 'NO', 'now()')
  ) AS expected(table_name, column_name, udt_name, is_nullable, column_default)
  JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = expected.table_name
   AND actual.column_name = expected.column_name
   AND actual.udt_name = expected.udt_name
   AND actual.is_nullable = expected.is_nullable
   AND actual.column_default IS NOT DISTINCT FROM expected.column_default
  INTO expected_column_count;

  SELECT to_regprocedure('public.protect_platform_role()') IS NOT NULL
  INTO has_function;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
    WHERE p.oid = to_regprocedure('public.protect_platform_role()')
      AND p.prosecdef
      AND r.rolname = 'postgres'
      AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
      AND p.prosrc LIKE '%auth.jwt()%'
      AND p.prosrc LIKE '%session_user = ''postgres''%'
      AND p.prosrc LIKE '%ERRCODE = ''42501''%'
      AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
      AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) INTO has_function_contract;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'profiles'
      AND t.tgname = 'protect_platform_role_trigger'
      AND NOT t.tgisinternal
  ) INTO has_trigger;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger t
    WHERE t.tgrelid = 'public.profiles'::regclass
      AND t.tgname = 'protect_platform_role_trigger'
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
      AND t.tgfoid = to_regprocedure('public.protect_platform_role()')
      AND t.tgtype = 19
      AND t.tgattr::text = (
        SELECT a.attnum::text
        FROM pg_catalog.pg_attribute a
        WHERE a.attrelid = 'public.profiles'::regclass
          AND a.attname = 'platform_role'
          AND NOT a.attisdropped
      )
  ) INTO has_trigger_contract;

  SELECT count(*)
  FROM (VALUES
    ('profiles', 'chk_platform_role', 'c'),
    ('ai_providers', 'ai_providers_pkey', 'p'),
    ('ai_providers', 'chk_provider_type', 'c'),
    ('ai_providers', 'chk_provider_status', 'c'),
    ('ai_providers', 'chk_provider_display_name', 'c'),
    ('ai_provider_credentials', 'ai_provider_credentials_pkey', 'p'),
    ('ai_provider_credentials', 'ai_provider_credentials_provider_fk', 'f'),
    ('ai_provider_credentials', 'uq_provider_credential', 'u'),
    ('ai_provider_credentials', 'chk_encrypted_payload_not_empty', 'c'),
    ('ai_provider_credentials', 'chk_credential_key_version_not_empty', 'c'),
    ('ai_provider_models', 'ai_provider_models_pkey', 'p'),
    ('ai_provider_models', 'ai_provider_models_provider_fk', 'f'),
    ('ai_provider_models', 'uq_provider_model', 'u'),
    ('ai_provider_models', 'uq_provider_model_identity', 'u'),
    ('ai_provider_models', 'chk_model_key_not_empty', 'c'),
    ('ai_provider_models', 'chk_model_display_name_not_empty', 'c'),
    ('ai_provider_models', 'chk_model_capabilities', 'c'),
    ('ai_capability_routes', 'ai_capability_routes_pkey', 'p'),
    ('ai_capability_routes', 'chk_capability', 'c'),
    ('ai_capability_routes', 'chk_fallback_pair', 'c'),
    ('ai_capability_routes', 'ai_route_primary_model_provider_fk', 'f'),
    ('ai_capability_routes', 'ai_route_fallback_model_provider_fk', 'f')
  ) AS expected(table_name, constraint_name, constraint_type)
  JOIN pg_catalog.pg_class c ON c.relname = expected.table_name
  JOIN pg_catalog.pg_namespace n
    ON n.oid = c.relnamespace
   AND n.nspname = 'public'
  JOIN pg_catalog.pg_constraint con
    ON con.conrelid = c.oid
   AND con.conname = expected.constraint_name
   AND con.contype = expected.constraint_type::"char"
   AND con.convalidated
  INTO expected_constraint_count;

  SELECT count(*)
  FROM pg_catalog.pg_indexes
  WHERE schemaname = 'public'
    AND (
      (
        indexname = 'idx_ai_capability_routes_primary_model_provider'
        AND indexdef LIKE '%(primary_model_id, primary_provider_id)%'
      )
      OR
      (
        indexname = 'idx_ai_capability_routes_fallback_model_provider'
        AND indexdef LIKE '%(fallback_model_id, fallback_provider_id)%'
        AND indexdef LIKE '%WHERE (fallback_model_id IS NOT NULL)%'
      )
    )
  INTO route_index_count;

  SELECT count(*)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
    AND c.relrowsecurity
  INTO rls_table_count;

  SELECT count(*)
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
  INTO policy_count;

  SELECT count(*)
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
    AND grantee IN ('anon', 'authenticated')
  INTO client_grant_count;

  SELECT count(*)
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
    AND grantee = 'service_role'
    AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  INTO service_grant_count;

  has_any_object := has_platform_role
    OR governance_table_count > 0
    OR has_function
    OR has_trigger
    OR expected_constraint_count > 0;

  has_complete_object_set := has_platform_role
    AND has_platform_role_contract
    AND has_platform_role_constraint_contract
    AND governance_table_count = 4
    AND expected_column_count = 29
    AND has_function
    AND has_function_contract
    AND has_trigger
    AND has_trigger_contract
    AND expected_constraint_count = 22
    AND route_index_count = 2
    AND rls_table_count = 4
    AND policy_count = 0
    AND client_grant_count = 0
    AND service_grant_count = 16;

  IF has_any_object AND NOT has_complete_object_set THEN
    RAISE EXCEPTION
      'PARTIAL_STATE: AI governance objects are incomplete; run the DB-1 preflight and resolve before applying';
  END IF;
END;
$migration_guard$;

-- 1. Global platform role. Existing rows remain NULL; there is no backfill.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role text;

ALTER TABLE public.profiles
  ALTER COLUMN platform_role DROP DEFAULT;

DO $platform_role_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'chk_platform_role'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_platform_role
      CHECK (platform_role IS NULL OR platform_role = 'superadmin');
  END IF;
END;
$platform_role_constraint$;

-- Reject role changes unless they originate from a service-role JWT or the
-- trusted postgres session used by Supabase migrations / SQL Editor.
CREATE OR REPLACE FUNCTION public.protect_platform_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  request_role text := COALESCE(auth.jwt() ->> 'role', '');
BEGIN
  IF NEW.platform_role IS NOT DISTINCT FROM OLD.platform_role THEN
    RETURN NEW;
  END IF;

  IF request_role = 'service_role' OR session_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'platform_role may only be changed by a trusted server operation'
    USING ERRCODE = '42501';
END;
$function$;

ALTER FUNCTION public.protect_platform_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.protect_platform_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_platform_role() TO service_role;

DROP TRIGGER IF EXISTS protect_platform_role_trigger ON public.profiles;
CREATE TRIGGER protect_platform_role_trigger
  BEFORE UPDATE OF platform_role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_platform_role();

-- 2. Providers.
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid CONSTRAINT ai_providers_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type text NOT NULL,
  display_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_provider_type
    CHECK (provider_type IN ('gemini', 'openai', 'runway')),
  CONSTRAINT chk_provider_status
    CHECK (status IN ('active', 'error', 'configuring')),
  CONSTRAINT chk_provider_display_name
    CHECK (btrim(display_name) <> '')
);

-- 3. Encrypted, server-side provider credentials (one row per provider).
CREATE TABLE IF NOT EXISTS public.ai_provider_credentials (
  id uuid CONSTRAINT ai_provider_credentials_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  encrypted_payload text NOT NULL,
  key_version text NOT NULL DEFAULT '1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_provider_credentials_provider_fk
    FOREIGN KEY (provider_id)
    REFERENCES public.ai_providers(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_provider_credential UNIQUE (provider_id),
  CONSTRAINT chk_encrypted_payload_not_empty
    CHECK (btrim(encrypted_payload) <> ''),
  CONSTRAINT chk_credential_key_version_not_empty
    CHECK (btrim(key_version) <> '')
);

-- 4. Provider models. The identity pair supports composite route FKs that
-- guarantee a selected model belongs to the selected provider.
CREATE TABLE IF NOT EXISTS public.ai_provider_models (
  id uuid CONSTRAINT ai_provider_models_pkey PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  model_key text NOT NULL,
  display_name text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}'::text[],
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_provider_models_provider_fk
    FOREIGN KEY (provider_id)
    REFERENCES public.ai_providers(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_provider_model UNIQUE (provider_id, model_key),
  CONSTRAINT uq_provider_model_identity UNIQUE (id, provider_id),
  CONSTRAINT chk_model_key_not_empty CHECK (btrim(model_key) <> ''),
  CONSTRAINT chk_model_display_name_not_empty CHECK (btrim(display_name) <> ''),
  CONSTRAINT chk_model_capabilities CHECK (
    capabilities <@ ARRAY[
      'structured-generation',
      'text-generation',
      'image-generation',
      'video-generation'
    ]::text[]
  )
);

-- 5. One global provider/model route per capability.
CREATE TABLE IF NOT EXISTS public.ai_capability_routes (
  capability text CONSTRAINT ai_capability_routes_pkey PRIMARY KEY,
  primary_provider_id uuid NOT NULL,
  primary_model_id uuid NOT NULL,
  fallback_provider_id uuid,
  fallback_model_id uuid,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_capability CHECK (
    capability IN (
      'structured-generation',
      'text-generation',
      'image-generation',
      'video-generation'
    )
  ),
  CONSTRAINT chk_fallback_pair CHECK (
    (fallback_provider_id IS NULL AND fallback_model_id IS NULL)
    OR
    (fallback_provider_id IS NOT NULL AND fallback_model_id IS NOT NULL)
  ),
  CONSTRAINT ai_route_primary_model_provider_fk
    FOREIGN KEY (primary_model_id, primary_provider_id)
    REFERENCES public.ai_provider_models(id, provider_id)
    ON DELETE RESTRICT,
  CONSTRAINT ai_route_fallback_model_provider_fk
    FOREIGN KEY (fallback_model_id, fallback_provider_id)
    REFERENCES public.ai_provider_models(id, provider_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_capability_routes_primary_model_provider
  ON public.ai_capability_routes (primary_model_id, primary_provider_id);

CREATE INDEX IF NOT EXISTS idx_ai_capability_routes_fallback_model_provider
  ON public.ai_capability_routes (fallback_model_id, fallback_provider_id)
  WHERE fallback_model_id IS NOT NULL;

-- 6. Server-only access. No anon/authenticated policies are created.
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_capability_routes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.ai_providers,
  public.ai_provider_credentials,
  public.ai_provider_models,
  public.ai_capability_routes
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.ai_providers,
  public.ai_provider_credentials,
  public.ai_provider_models,
  public.ai_capability_routes
TO service_role;

COMMIT;
