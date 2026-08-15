-- Migration: 20260814000000_early_access_security.sql
-- Scope: closed-beta applications, access-status protection, and invite security.
-- This migration is transactional and fails closed on incompatible/partial state.

BEGIN;

DO $migration_guard$
DECLARE
  required_invite_columns integer;
  new_object_count integer;
  new_table_count integer;
  new_function_count integer;
  function_contract_count integer;
  new_trigger_count integer;
  trigger_contract_count integer;
  application_column_count integer;
  redemption_column_count integer;
  expected_constraint_count integer;
  rls_table_count integer;
  server_table_policy_count integer;
  profile_update_policy_count integer;
  client_grant_count integer;
  service_grant_count integer;
  invalid_access_status_count bigint;
  invalid_invite_count bigint;
  unknown_profile_update_policies integer;
  unknown_invite_policies integer;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'BLOCKED: required table public.profiles does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'access_status'
      AND data_type = 'text'
      AND is_nullable = 'NO'
      AND column_default = '''WAITLIST''::text'
  ) THEN
    RAISE EXCEPTION 'BLOCKED: profiles.access_status is missing or incompatible';
  END IF;

  IF to_regclass('public.invite_codes') IS NULL THEN
    RAISE EXCEPTION 'BLOCKED: required legacy table public.invite_codes does not exist';
  END IF;

  SELECT count(*)
  FROM (VALUES
    ('id', 'uuid', 'NO'),
    ('code', 'text', 'NO'),
    ('created_by', 'uuid', 'YES'),
    ('max_uses', 'int4', 'NO'),
    ('current_uses', 'int4', 'NO'),
    ('expires_at', 'timestamptz', 'YES'),
    ('target_role', 'text', 'NO'),
    ('notes', 'text', 'YES'),
    ('created_at', 'timestamptz', 'NO')
  ) AS expected(column_name, udt_name, is_nullable)
  JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'invite_codes'
   AND actual.column_name = expected.column_name
   AND actual.udt_name = expected.udt_name
   AND actual.is_nullable = expected.is_nullable
  INTO required_invite_columns;

  IF required_invite_columns <> 9 THEN
    RAISE EXCEPTION 'BLOCKED: public.invite_codes has an incompatible contract';
  END IF;

  SELECT count(*)
  FROM public.profiles
  WHERE access_status NOT IN (
    'WAITLIST', 'INVITED', 'BETA_TESTER', 'ACTIVE', 'SUSPENDED', 'BANNED'
  )
  INTO invalid_access_status_count;

  IF invalid_access_status_count > 0 THEN
    RAISE EXCEPTION
      'BLOCKED: % profile(s) use legacy/invalid access_status values; resolve explicitly before EA-1',
      invalid_access_status_count;
  END IF;

  SELECT count(*)
  FROM public.invite_codes
  WHERE btrim(code) = ''
     OR max_uses <= 0
     OR current_uses < 0
     OR current_uses > max_uses
     OR target_role NOT IN ('BETA_TESTER', 'ACTIVE')
  INTO invalid_invite_count;

  IF invalid_invite_count > 0 THEN
    RAISE EXCEPTION
      'BLOCKED: % invite code(s) violate the EA-1 security contract',
      invalid_invite_count;
  END IF;

  SELECT count(*)
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND cmd = 'UPDATE'
    AND policyname <> 'Usuários podem atualizar seu próprio perfil'
  INTO unknown_profile_update_policies;

  IF unknown_profile_update_policies > 0 THEN
    RAISE EXCEPTION
      'BLOCKED: profiles has unknown UPDATE policies; review before applying EA-1';
  END IF;

  SELECT count(*)
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'invite_codes'
    AND policyname NOT IN (
      'Admins can manage invite codes',
      'Anyone can read invite codes to validate'
    )
  INTO unknown_invite_policies;

  IF unknown_invite_policies > 0 THEN
    RAISE EXCEPTION
      'BLOCKED: invite_codes has unknown policies; review before applying EA-1';
  END IF;

  SELECT count(*)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname IN (
      'early_access_applications',
      'invite_code_redemptions'
    )
  INTO new_table_count;

  SELECT count(*)
  FROM (VALUES
    ('id', 'uuid', 'NO'), ('name', 'text', 'NO'),
    ('email', 'text', 'NO'), ('email_normalized', 'text', 'NO'),
    ('status', 'text', 'NO'), ('primary_goal', 'text', 'YES'),
    ('source', 'text', 'YES'), ('utm_source', 'text', 'YES'),
    ('utm_medium', 'text', 'YES'), ('utm_campaign', 'text', 'YES'),
    ('utm_content', 'text', 'YES'), ('utm_term', 'text', 'YES'),
    ('created_at', 'timestamptz', 'NO'), ('updated_at', 'timestamptz', 'NO'),
    ('invited_at', 'timestamptz', 'YES'), ('approved_at', 'timestamptz', 'YES'),
    ('rejected_at', 'timestamptz', 'YES')
  ) AS expected(column_name, udt_name, is_nullable)
  JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'early_access_applications'
   AND actual.column_name = expected.column_name
   AND actual.udt_name = expected.udt_name
   AND actual.is_nullable = expected.is_nullable
  INTO application_column_count;

  SELECT count(*)
  FROM (VALUES
    ('id', 'uuid', 'NO'),
    ('invite_code_id', 'uuid', 'NO'),
    ('user_id', 'uuid', 'NO'),
    ('granted_access_status', 'text', 'NO'),
    ('redeemed_at', 'timestamptz', 'NO')
  ) AS expected(column_name, udt_name, is_nullable)
  JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = 'invite_code_redemptions'
   AND actual.column_name = expected.column_name
   AND actual.udt_name = expected.udt_name
   AND actual.is_nullable = expected.is_nullable
  INTO redemption_column_count;

  SELECT count(*)
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN (VALUES
    ('profiles', 'chk_profiles_access_status', 'c'),
    ('early_access_applications', 'early_access_applications_pkey', 'p'),
    ('early_access_applications', 'uq_early_access_applications_email_normalized', 'u'),
    ('early_access_applications', 'chk_early_access_application_status', 'c'),
    ('early_access_applications', 'chk_early_access_application_name', 'c'),
    ('early_access_applications', 'chk_early_access_application_email', 'c'),
    ('invite_codes', 'chk_invite_code_not_empty', 'c'),
    ('invite_codes', 'chk_invite_usage_bounds', 'c'),
    ('invite_codes', 'chk_invite_target_access_status', 'c'),
    ('invite_code_redemptions', 'invite_code_redemptions_pkey', 'p'),
    ('invite_code_redemptions', 'invite_code_redemptions_invite_fk', 'f'),
    ('invite_code_redemptions', 'invite_code_redemptions_user_fk', 'f'),
    ('invite_code_redemptions', 'uq_invite_code_redemption_user', 'u'),
    ('invite_code_redemptions', 'chk_redemption_access_status', 'c')
  ) AS expected(table_name, constraint_name, constraint_type)
    ON expected.table_name = c.relname
   AND expected.constraint_name = con.conname
   AND expected.constraint_type::"char" = con.contype
  WHERE n.nspname = 'public'
    AND con.convalidated
  INTO expected_constraint_count;

  SELECT count(*)
  FROM (VALUES
    ('public.prepare_early_access_application()'),
    ('public.protect_access_status()'),
    ('public.redeem_early_access_invite(text,uuid)')
  ) AS expected(signature)
  WHERE to_regprocedure(expected.signature) IS NOT NULL
  INTO new_function_count;

  SELECT count(*)
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
  WHERE (
    p.oid = to_regprocedure('public.protect_access_status()')
    AND p.prosecdef
    AND owner_role.rolname = 'postgres'
    AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
    AND p.prosrc LIKE '%auth.jwt()%'
    AND p.prosrc LIKE '%ERRCODE = ''42501''%'
    AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) OR (
    p.oid = to_regprocedure('public.prepare_early_access_application()')
    AND NOT p.prosecdef
    AND owner_role.rolname = 'postgres'
    AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
    AND p.prosrc LIKE '%invalid early access application transition%'
    AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) OR (
    p.oid = to_regprocedure('public.redeem_early_access_invite(text,uuid)')
    AND p.prosecdef
    AND owner_role.rolname = 'postgres'
    AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
    AND p.prosrc LIKE '%FOR UPDATE%'
    AND p.prosrc LIKE '%invite code expired%'
    AND p.prosrc LIKE '%invite code exhausted%'
    AND p.prosrc LIKE '%invite_code_redemptions%'
    AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  )
  INTO function_contract_count;

  SELECT count(*)
  FROM pg_catalog.pg_trigger t
  WHERE NOT t.tgisinternal
    AND (
      (t.tgrelid = 'public.profiles'::regclass
        AND t.tgname = 'protect_access_status_trigger')
      OR
      (t.tgrelid = to_regclass('public.early_access_applications')
        AND t.tgname = 'prepare_early_access_application_trigger')
  )
  INTO new_trigger_count;

  SELECT count(*)
  FROM pg_catalog.pg_trigger t
  WHERE NOT t.tgisinternal
    AND t.tgenabled <> 'D'
    AND (
      (t.tgrelid = 'public.profiles'::regclass
        AND t.tgname = 'protect_access_status_trigger'
        AND t.tgtype = 19
        AND t.tgfoid = to_regprocedure('public.protect_access_status()'))
      OR
      (t.tgrelid = to_regclass('public.early_access_applications')
        AND t.tgname = 'prepare_early_access_application_trigger'
        AND t.tgtype = 23
        AND t.tgfoid = to_regprocedure('public.prepare_early_access_application()'))
    )
  INTO trigger_contract_count;

  SELECT count(*)
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'early_access_applications',
      'invite_code_redemptions',
      'invite_codes'
    )
    AND c.relrowsecurity
  INTO rls_table_count;

  SELECT count(*)
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'early_access_applications',
      'invite_code_redemptions',
      'invite_codes'
    )
  INTO server_table_policy_count;

  SELECT count(*)
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND cmd = 'UPDATE'
  INTO profile_update_policy_count;

  SELECT count(*)
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('PUBLIC', 'anon', 'authenticated')
    AND (
      table_name IN (
        'early_access_applications',
        'invite_code_redemptions',
        'invite_codes'
      )
      OR (table_name = 'profiles' AND privilege_type = 'UPDATE')
    )
  INTO client_grant_count;

  SELECT count(*)
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN (
      'early_access_applications',
      'invite_code_redemptions',
      'invite_codes'
    )
    AND grantee = 'service_role'
    AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  INTO service_grant_count;

  new_object_count := new_table_count + new_function_count + new_trigger_count;

  IF new_object_count > 0
     AND NOT (
       new_table_count = 2
       AND application_column_count = 17
       AND redemption_column_count = 5
       AND new_function_count = 3
       AND function_contract_count = 3
       AND new_trigger_count = 2
       AND trigger_contract_count = 2
       AND expected_constraint_count = 14
       AND rls_table_count = 3
       AND server_table_policy_count = 0
       AND profile_update_policy_count = 0
       AND client_grant_count = 0
       AND service_grant_count = 12
     ) THEN
    RAISE EXCEPTION
      'PARTIAL_STATE: EA-1 objects are incomplete; run the Early Access preflight';
  END IF;
END;
$migration_guard$;

-- Access-status values represent product access only. Platform administration
-- remains exclusively in profiles.platform_role.
DO $access_status_constraint$
DECLARE
  constraint_record record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint con
    WHERE con.conrelid = 'public.profiles'::regclass
      AND con.conname = 'chk_profiles_access_status'
      AND NOT (
        con.contype = 'c'
        AND con.convalidated
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%BETA_TESTER%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%SUSPENDED%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) NOT LIKE '%INTERNAL%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) NOT LIKE '%ADMIN%'
      )
  ) THEN
    RAISE EXCEPTION 'PARTIAL_STATE: chk_profiles_access_status is incompatible';
  END IF;

  FOR constraint_record IN
    SELECT con.conname
    FROM pg_catalog.pg_constraint con
    WHERE con.conrelid = 'public.profiles'::regclass
      AND con.contype = 'c'
      AND con.conname <> 'chk_profiles_access_status'
      AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%access_status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.profiles DROP CONSTRAINT %I',
      constraint_record.conname
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint con
    WHERE con.conrelid = 'public.profiles'::regclass
      AND con.conname = 'chk_profiles_access_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_access_status
      CHECK (access_status IN (
        'WAITLIST',
        'INVITED',
        'BETA_TESTER',
        'ACTIVE',
        'SUSPENDED',
        'BANNED'
      ));
  END IF;
END;
$access_status_constraint$;

CREATE OR REPLACE FUNCTION public.protect_access_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  request_role text := COALESCE(auth.jwt() ->> 'role', '');
BEGIN
  IF NEW.access_status IS NOT DISTINCT FROM OLD.access_status THEN
    RETURN NEW;
  END IF;

  IF request_role = 'service_role' OR session_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'access_status may only be changed by a trusted server operation'
    USING ERRCODE = '42501';
END;
$function$;

ALTER FUNCTION public.protect_access_status() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.protect_access_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_access_status() TO service_role;

DROP TRIGGER IF EXISTS protect_access_status_trigger ON public.profiles;
CREATE TRIGGER protect_access_status_trigger
  BEFORE UPDATE OF access_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_access_status();

-- No profile fields are currently approved as client-writable. Future
-- self-service fields must use a dedicated server endpoint or narrow RPC.
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil"
  ON public.profiles;

DO $profile_policy_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'UPDATE'
  ) THEN
    RAISE EXCEPTION 'PARTIAL_STATE: profiles still has client UPDATE policies';
  END IF;
END;
$profile_policy_guard$;

REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO service_role;

CREATE TABLE IF NOT EXISTS public.early_access_applications (
  id uuid CONSTRAINT early_access_applications_pkey
    PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  email_normalized text NOT NULL,
  status text NOT NULL DEFAULT 'WAITLIST',
  primary_goal text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  invited_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  CONSTRAINT uq_early_access_applications_email_normalized
    UNIQUE (email_normalized),
  CONSTRAINT chk_early_access_application_status
    CHECK (status IN ('WAITLIST', 'INVITED', 'APPROVED', 'REJECTED')),
  CONSTRAINT chk_early_access_application_name
    CHECK (btrim(name) <> ''),
  CONSTRAINT chk_early_access_application_email
    CHECK (
      btrim(email) <> ''
      AND email_normalized = lower(btrim(email))
    )
);

CREATE OR REPLACE FUNCTION public.prepare_early_access_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.name := btrim(NEW.name);
  NEW.email := btrim(NEW.email);
  NEW.email_normalized := lower(NEW.email);
  NEW.updated_at := now();

  IF NEW.name = '' OR NEW.email = '' THEN
    RAISE EXCEPTION 'name and email are required'
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'WAITLIST' THEN
      RAISE EXCEPTION 'new applications must start in WAITLIST'
        USING ERRCODE = '23514';
    END IF;

    NEW.invited_at := NULL;
    NEW.approved_at := NULL;
    NEW.rejected_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'WAITLIST' AND NEW.status IN ('INVITED', 'APPROVED', 'REJECTED'))
      OR
      (OLD.status = 'INVITED' AND NEW.status IN ('APPROVED', 'REJECTED'))
      OR
      (OLD.status = 'REJECTED' AND NEW.status = 'WAITLIST')
    ) THEN
      RAISE EXCEPTION 'invalid early access application transition: % -> %',
        OLD.status,
        NEW.status
        USING ERRCODE = '23514';
    END IF;

    CASE NEW.status
      WHEN 'WAITLIST' THEN
        NEW.invited_at := NULL;
        NEW.approved_at := NULL;
        NEW.rejected_at := NULL;
      WHEN 'INVITED' THEN
        NEW.invited_at := COALESCE(NEW.invited_at, now());
        NEW.approved_at := NULL;
        NEW.rejected_at := NULL;
      WHEN 'APPROVED' THEN
        NEW.approved_at := COALESCE(NEW.approved_at, now());
        NEW.rejected_at := NULL;
      WHEN 'REJECTED' THEN
        NEW.rejected_at := COALESCE(NEW.rejected_at, now());
        NEW.approved_at := NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$function$;

ALTER FUNCTION public.prepare_early_access_application() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.prepare_early_access_application()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_early_access_application()
  TO service_role;

DROP TRIGGER IF EXISTS prepare_early_access_application_trigger
  ON public.early_access_applications;
CREATE TRIGGER prepare_early_access_application_trigger
  BEFORE INSERT OR UPDATE ON public.early_access_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_early_access_application();

ALTER TABLE public.early_access_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.early_access_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.early_access_applications
  TO service_role;

-- Remove both legacy policies. Invite validation and administration become
-- server-only operations; no client receives the invite catalog.
DROP POLICY IF EXISTS "Anyone can read invite codes to validate"
  ON public.invite_codes;
DROP POLICY IF EXISTS "Admins can manage invite codes"
  ON public.invite_codes;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.invite_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invite_codes TO service_role;

DO $invite_constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.invite_codes'::regclass
      AND conname = 'chk_invite_code_not_empty'
  ) THEN
    ALTER TABLE public.invite_codes
      ADD CONSTRAINT chk_invite_code_not_empty
      CHECK (btrim(code) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.invite_codes'::regclass
      AND conname = 'chk_invite_usage_bounds'
  ) THEN
    ALTER TABLE public.invite_codes
      ADD CONSTRAINT chk_invite_usage_bounds
      CHECK (max_uses > 0 AND current_uses >= 0 AND current_uses <= max_uses);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.invite_codes'::regclass
      AND conname = 'chk_invite_target_access_status'
  ) THEN
    ALTER TABLE public.invite_codes
      ADD CONSTRAINT chk_invite_target_access_status
      CHECK (target_role IN ('BETA_TESTER', 'ACTIVE'));
  END IF;
END;
$invite_constraints$;

CREATE TABLE IF NOT EXISTS public.invite_code_redemptions (
  id uuid CONSTRAINT invite_code_redemptions_pkey
    PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id uuid NOT NULL,
  user_id uuid NOT NULL,
  granted_access_status text NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invite_code_redemptions_invite_fk
    FOREIGN KEY (invite_code_id)
    REFERENCES public.invite_codes(id)
    ON DELETE RESTRICT,
  CONSTRAINT invite_code_redemptions_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_invite_code_redemption_user
    UNIQUE (invite_code_id, user_id),
  CONSTRAINT chk_redemption_access_status
    CHECK (granted_access_status IN ('BETA_TESTER', 'ACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_invite_code_redemptions_user_id
  ON public.invite_code_redemptions (user_id);

ALTER TABLE public.invite_code_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.invite_code_redemptions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.invite_code_redemptions
  TO service_role;

CREATE OR REPLACE FUNCTION public.redeem_early_access_invite(
  p_code text,
  p_user_id uuid
)
RETURNS TABLE (invite_id uuid, access_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  selected_invite public.invite_codes%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR btrim(COALESCE(p_code, '')) = '' THEN
    RAISE EXCEPTION 'invite code and user id are required'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'profile does not exist'
      USING ERRCODE = '23503';
  END IF;

  SELECT invite.*
  INTO selected_invite
  FROM public.invite_codes invite
  WHERE invite.code = btrim(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid invite code'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.invite_code_redemptions redemption
    WHERE redemption.invite_code_id = selected_invite.id
      AND redemption.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'invite code already redeemed by this user'
      USING ERRCODE = '23505';
  END IF;

  IF selected_invite.expires_at IS NOT NULL
     AND selected_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'invite code expired'
      USING ERRCODE = '22023';
  END IF;

  IF selected_invite.current_uses >= selected_invite.max_uses THEN
    RAISE EXCEPTION 'invite code exhausted'
      USING ERRCODE = '22023';
  END IF;

  IF selected_invite.target_role NOT IN ('BETA_TESTER', 'ACTIVE') THEN
    RAISE EXCEPTION 'invite target access status is invalid'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.invite_codes
  SET current_uses = current_uses + 1
  WHERE id = selected_invite.id;

  UPDATE public.profiles
  SET access_status = selected_invite.target_role
  WHERE id = p_user_id;

  INSERT INTO public.invite_code_redemptions (
    invite_code_id,
    user_id,
    granted_access_status
  ) VALUES (
    selected_invite.id,
    p_user_id,
    selected_invite.target_role
  );

  RETURN QUERY
  SELECT selected_invite.id, selected_invite.target_role;
END;
$function$;

ALTER FUNCTION public.redeem_early_access_invite(text, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.redeem_early_access_invite(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_early_access_invite(text, uuid)
  TO service_role;

DO $final_policy_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'early_access_applications',
        'invite_code_redemptions',
        'invite_codes'
      )
  ) THEN
    RAISE EXCEPTION 'PARTIAL_STATE: server-only Early Access tables have policies';
  END IF;
END;
$final_policy_guard$;

COMMIT;
