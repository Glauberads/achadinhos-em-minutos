-- EA-1 behavioral security tests (TEST DATABASE ONLY).
-- Preconditions:
--   1. AI governance and EA-1 migrations are applied to a disposable database.
--   2. At least one auth user/profile exists.
-- This script mutates test data but rolls the entire test transaction back.
-- NEVER run as production preflight/postflight.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_sqlstate(
  statement_to_run text,
  expected_sqlstate text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $assertion$
BEGIN
  BEGIN
    EXECUTE statement_to_run;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = expected_sqlstate THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'expected SQLSTATE %, received %: %',
      expected_sqlstate,
      SQLSTATE,
      SQLERRM;
  END;

  RAISE EXCEPTION 'expected SQLSTATE %, but statement succeeded',
    expected_sqlstate;
END;
$assertion$;

DO $fixture_guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    RAISE EXCEPTION 'EA-1 security tests require one disposable test profile';
  END IF;
END;
$fixture_guard$;

CREATE TEMP TABLE ea_test_identity AS
SELECT id AS user_id
FROM public.profiles
ORDER BY id
LIMIT 1;

GRANT SELECT ON TABLE ea_test_identity TO anon, authenticated, service_role;

GRANT UPDATE ON TABLE public.profiles TO authenticated;
CREATE POLICY ea_test_authenticated_profile_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'role', 'authenticated',
    'sub', (SELECT user_id FROM ea_test_identity)
  )::text,
  true
);

SET LOCAL ROLE authenticated;

SELECT pg_temp.assert_sqlstate(
  format(
    'UPDATE public.profiles SET access_status = ''ACTIVE'' WHERE id = %L',
    (SELECT user_id FROM ea_test_identity)
  ),
  '42501'
);

SELECT pg_temp.assert_sqlstate(
  format(
    'UPDATE public.profiles SET platform_role = ''superadmin'' WHERE id = %L',
    (SELECT user_id FROM ea_test_identity)
  ),
  '42501'
);

SELECT pg_temp.assert_sqlstate(
  'SELECT * FROM public.early_access_applications',
  '42501'
);

SELECT pg_temp.assert_sqlstate(
  'SELECT * FROM public.invite_codes',
  '42501'
);

RESET ROLE;
SET LOCAL ROLE anon;

SELECT pg_temp.assert_sqlstate(
  'SELECT * FROM public.early_access_applications',
  '42501'
);

SELECT pg_temp.assert_sqlstate(
  'SELECT * FROM public.invite_codes',
  '42501'
);

RESET ROLE;

INSERT INTO public.invite_codes (
  code,
  max_uses,
  current_uses,
  expires_at,
  target_role,
  notes
) VALUES
  ('EA1-VALID-TEST', 1, 0, now() + interval '1 hour', 'BETA_TESTER', 'EA-1 test'),
  ('EA1-EXPIRED-TEST', 1, 0, now() - interval '1 hour', 'BETA_TESTER', 'EA-1 test'),
  ('EA1-EXHAUSTED-TEST', 1, 1, now() + interval '1 hour', 'BETA_TESTER', 'EA-1 test');

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'role', 'service_role',
    'sub', (SELECT user_id FROM ea_test_identity)
  )::text,
  true
);

SET LOCAL ROLE service_role;

SELECT *
FROM public.redeem_early_access_invite(
  'EA1-VALID-TEST',
  (SELECT user_id FROM ea_test_identity)
);

DO $valid_assertion$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.invite_codes
    WHERE code = 'EA1-VALID-TEST'
      AND current_uses = 1
  ) THEN
    RAISE EXCEPTION 'valid invite did not increment exactly once';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT user_id FROM ea_test_identity)
      AND access_status = 'BETA_TESTER'
  ) THEN
    RAISE EXCEPTION 'valid invite did not grant BETA_TESTER';
  END IF;
END;
$valid_assertion$;

SELECT pg_temp.assert_sqlstate(
  format(
    'SELECT * FROM public.redeem_early_access_invite(''EA1-EXPIRED-TEST'', %L)',
    (SELECT user_id FROM ea_test_identity)
  ),
  '22023'
);

SELECT pg_temp.assert_sqlstate(
  format(
    'SELECT * FROM public.redeem_early_access_invite(''EA1-EXHAUSTED-TEST'', %L)',
    (SELECT user_id FROM ea_test_identity)
  ),
  '22023'
);

RESET ROLE;
ROLLBACK;
