-- EA-1 postflight (STRICTLY READ ONLY)
-- Expected aggregate result: POSTFLIGHT_PASS.

SELECT
  c.table_name,
  c.column_name,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    (c.table_name = 'profiles' AND c.column_name IN ('access_status', 'platform_role'))
    OR c.table_name IN (
      'early_access_applications',
      'invite_codes',
      'invite_code_redemptions'
    )
  )
ORDER BY c.table_name, c.ordinal_position;

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COALESCE(p.policy_count, 0) AS policy_count,
  COALESCE(g.client_grant_count, 0) AS client_grant_count
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
  SELECT tablename, count(*) AS policy_count
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = c.relname
LEFT JOIN (
  SELECT table_name, count(*) AS client_grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('PUBLIC', 'anon', 'authenticated')
  GROUP BY table_name
) g ON g.table_name = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN (
    'early_access_applications',
    'invite_codes',
    'invite_code_redemptions'
  )
ORDER BY c.relname;

SELECT
  c.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  con.convalidated AS validated,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'profiles',
    'early_access_applications',
    'invite_codes',
    'invite_code_redemptions'
  )
ORDER BY c.relname, con.conname;

SELECT
  p.oid::regprocedure AS function_name,
  owner_role.rolname AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS function_config,
  NOT has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute_revoked,
  NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AS authenticated_execute_revoked,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_execute
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
WHERE p.oid IN (
  to_regprocedure('public.prepare_early_access_application()'),
  to_regprocedure('public.protect_access_status()'),
  to_regprocedure('public.redeem_early_access_invite(text,uuid)')
)
ORDER BY p.oid::regprocedure::text;

SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  t.tgfoid::regprocedure AS trigger_function,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
FROM pg_catalog.pg_trigger t
WHERE NOT t.tgisinternal
  AND t.tgname IN (
    'protect_access_status_trigger',
    'prepare_early_access_application_trigger'
  )
ORDER BY t.tgname;

WITH expected_application_columns(column_name, udt_name, is_nullable) AS (
  VALUES
    ('id', 'uuid', 'NO'), ('name', 'text', 'NO'),
    ('email', 'text', 'NO'), ('email_normalized', 'text', 'NO'),
    ('status', 'text', 'NO'), ('primary_goal', 'text', 'YES'),
    ('source', 'text', 'YES'), ('utm_source', 'text', 'YES'),
    ('utm_medium', 'text', 'YES'), ('utm_campaign', 'text', 'YES'),
    ('utm_content', 'text', 'YES'), ('utm_term', 'text', 'YES'),
    ('created_at', 'timestamptz', 'NO'), ('updated_at', 'timestamptz', 'NO'),
    ('invited_at', 'timestamptz', 'YES'), ('approved_at', 'timestamptz', 'YES'),
    ('rejected_at', 'timestamptz', 'YES')
),
expected_redemption_columns(column_name, udt_name, is_nullable) AS (
  VALUES
    ('id', 'uuid', 'NO'), ('invite_code_id', 'uuid', 'NO'),
    ('user_id', 'uuid', 'NO'), ('granted_access_status', 'text', 'NO'),
    ('redeemed_at', 'timestamptz', 'NO')
),
facts AS (
  SELECT
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'access_status'
        AND data_type = 'text'
        AND is_nullable = 'NO'
        AND column_default = '''WAITLIST''::text'
    ) AS access_status_column_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint con
      WHERE con.conrelid = to_regclass('public.profiles')
        AND con.conname = 'chk_profiles_access_status'
        AND con.convalidated
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%BETA_TESTER%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%SUSPENDED%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) NOT LIKE '%INTERNAL%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) NOT LIKE '%ADMIN%'
    ) AS access_status_constraint_contract,
    (SELECT count(*)
      FROM expected_application_columns expected
      JOIN information_schema.columns actual
        ON actual.table_schema = 'public'
       AND actual.table_name = 'early_access_applications'
       AND actual.column_name = expected.column_name
       AND actual.udt_name = expected.udt_name
       AND actual.is_nullable = expected.is_nullable) AS application_column_count,
    (SELECT count(*)
      FROM expected_redemption_columns expected
      JOIN information_schema.columns actual
        ON actual.table_schema = 'public'
       AND actual.table_name = 'invite_code_redemptions'
       AND actual.column_name = expected.column_name
       AND actual.udt_name = expected.udt_name
       AND actual.is_nullable = expected.is_nullable) AS redemption_column_count,
    (SELECT count(*)
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND (c.relname, con.conname) IN (
          ('profiles', 'chk_profiles_access_status'),
          ('early_access_applications', 'early_access_applications_pkey'),
          ('early_access_applications', 'uq_early_access_applications_email_normalized'),
          ('early_access_applications', 'chk_early_access_application_status'),
          ('early_access_applications', 'chk_early_access_application_name'),
          ('early_access_applications', 'chk_early_access_application_email'),
          ('invite_codes', 'chk_invite_code_not_empty'),
          ('invite_codes', 'chk_invite_usage_bounds'),
          ('invite_codes', 'chk_invite_target_access_status'),
          ('invite_code_redemptions', 'invite_code_redemptions_pkey'),
          ('invite_code_redemptions', 'invite_code_redemptions_invite_fk'),
          ('invite_code_redemptions', 'invite_code_redemptions_user_fk'),
          ('invite_code_redemptions', 'uq_invite_code_redemption_user'),
          ('invite_code_redemptions', 'chk_redemption_access_status')
        )
        AND con.contype = CASE
          WHEN con.conname IN (
            'early_access_applications_pkey',
            'invite_code_redemptions_pkey'
          ) THEN 'p'::"char"
          WHEN con.conname IN (
            'uq_early_access_applications_email_normalized',
            'uq_invite_code_redemption_user'
          ) THEN 'u'::"char"
          WHEN con.conname IN (
            'invite_code_redemptions_invite_fk',
            'invite_code_redemptions_user_fk'
          ) THEN 'f'::"char"
          ELSE 'c'::"char"
        END
        AND con.convalidated) AS expected_constraint_count,
    (SELECT count(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'early_access_applications',
          'invite_codes',
          'invite_code_redemptions'
        )
        AND c.relrowsecurity) AS rls_table_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'early_access_applications',
          'invite_codes',
          'invite_code_redemptions'
        )) AS server_table_policy_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND cmd = 'UPDATE') AS profile_update_policy_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('PUBLIC', 'anon', 'authenticated')
        AND (
          table_name IN (
            'early_access_applications',
            'invite_codes',
            'invite_code_redemptions'
          )
          OR (table_name = 'profiles' AND privilege_type = 'UPDATE')
        )) AS client_grant_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'early_access_applications',
          'invite_codes',
          'invite_code_redemptions'
        )
        AND grantee = 'service_role'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
      AS service_grant_count,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
      WHERE p.oid = to_regprocedure('public.protect_access_status()')
        AND p.prosecdef
        AND owner_role.rolname = 'postgres'
        AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
        AND p.prosrc LIKE '%auth.jwt()%'
        AND p.prosrc LIKE '%ERRCODE = ''42501''%'
        AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
        AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
        AND has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) AS access_function_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
      WHERE p.oid = to_regprocedure('public.redeem_early_access_invite(text,uuid)')
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
    ) AS redeem_function_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = p.proowner
      WHERE p.oid = to_regprocedure('public.prepare_early_access_application()')
        AND NOT p.prosecdef
        AND owner_role.rolname = 'postgres'
        AND 'search_path=""' = ANY (COALESCE(p.proconfig, ARRAY[]::text[]))
        AND p.prosrc LIKE '%invalid early access application transition%'
        AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
        AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
        AND has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) AS application_function_contract,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = to_regclass('public.profiles')
        AND t.tgname = 'protect_access_status_trigger'
        AND NOT t.tgisinternal
        AND t.tgenabled <> 'D'
        AND t.tgtype = 19
        AND t.tgfoid = to_regprocedure('public.protect_access_status()')
    ) AS access_trigger_contract,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = to_regclass('public.early_access_applications')
        AND t.tgname = 'prepare_early_access_application_trigger'
        AND NOT t.tgisinternal
        AND t.tgenabled <> 'D'
        AND t.tgtype = 23
        AND t.tgfoid = to_regprocedure('public.prepare_early_access_application()')
    ) AS application_trigger_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc p
      WHERE p.oid = to_regprocedure('public.protect_platform_role()')
        AND p.prosecdef
        AND p.prosrc LIKE '%ERRCODE = ''42501''%'
    ) AS platform_role_protection_preserved
)
SELECT
  CASE
    WHEN access_status_column_contract
      AND access_status_constraint_contract
      AND application_column_count = 17
      AND redemption_column_count = 5
      AND expected_constraint_count = 14
      AND rls_table_count = 3
      AND server_table_policy_count = 0
      AND profile_update_policy_count = 0
      AND client_grant_count = 0
      AND service_grant_count = 12
      AND access_function_contract
      AND redeem_function_contract
      AND application_function_contract
      AND access_trigger_contract
      AND application_trigger_contract
      AND platform_role_protection_preserved
    THEN 'POSTFLIGHT_PASS'
    ELSE 'POSTFLIGHT_FAIL'
  END AS postflight_status,
  facts.*
FROM facts;
