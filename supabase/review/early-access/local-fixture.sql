-- EA-1 disposable PostgreSQL fixture (TEST DATABASE ONLY).
-- Creates the minimum pre-EA-1 Supabase-like baseline for local validation.

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END;
$roles$;

CREATE SCHEMA auth;

CREATE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb
$function$;

CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')::uuid
$function$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt(), auth.uid()
  TO anon, authenticated, service_role;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text NOT NULL
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'user',
  access_status text NOT NULL DEFAULT 'WAITLIST'
    CHECK (access_status IN (
      'WAITLIST', 'INVITED', 'ACTIVE', 'SUSPENDED', 'BANNED',
      'INTERNAL', 'BETA_TESTER', 'ADMIN'
    )),
  subscription_status text,
  platform_role text,
  CONSTRAINT chk_platform_role
    CHECK (platform_role IS NULL OR platform_role = 'superadmin')
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO service_role;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE FUNCTION public.protect_platform_role()
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
REVOKE ALL ON FUNCTION public.protect_platform_role()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_platform_role() TO service_role;

CREATE TRIGGER protect_platform_role_trigger
  BEFORE UPDATE OF platform_role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_platform_role();

CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  target_role text NOT NULL DEFAULT 'BETA_TESTER',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invite_codes
  TO anon, authenticated, service_role;

CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.access_status IN ('ADMIN', 'INTERNAL')
    )
  );
CREATE POLICY "Anyone can read invite codes to validate"
  ON public.invite_codes FOR SELECT
  USING (true);

INSERT INTO auth.users (id, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ea1-one@example.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'ea1-two@example.invalid');

INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users;
