-- EA-1 preflight (STRICTLY READ ONLY)
-- Execute before 20260814000000_early_access_security.sql.

WITH required_invite_columns(column_name, udt_name, is_nullable) AS (
  VALUES
    ('id', 'uuid', 'NO'),
    ('code', 'text', 'NO'),
    ('created_by', 'uuid', 'YES'),
    ('max_uses', 'int4', 'NO'),
    ('current_uses', 'int4', 'NO'),
    ('expires_at', 'timestamptz', 'YES'),
    ('target_role', 'text', 'NO'),
    ('notes', 'text', 'YES'),
    ('created_at', 'timestamptz', 'NO')
),
required_application_columns(column_name, udt_name, is_nullable) AS (
  VALUES
    ('id', 'uuid', 'NO'),
    ('name', 'text', 'NO'),
    ('email', 'text', 'NO'),
    ('email_normalized', 'text', 'NO'),
    ('status', 'text', 'NO'),
    ('primary_goal', 'text', 'YES'),
    ('source', 'text', 'YES'),
    ('utm_source', 'text', 'YES'),
    ('utm_medium', 'text', 'YES'),
    ('utm_campaign', 'text', 'YES'),
    ('utm_content', 'text', 'YES'),
    ('utm_term', 'text', 'YES'),
    ('created_at', 'timestamptz', 'NO'),
    ('updated_at', 'timestamptz', 'NO'),
    ('invited_at', 'timestamptz', 'YES'),
    ('approved_at', 'timestamptz', 'YES'),
    ('rejected_at', 'timestamptz', 'YES')
),
required_redemption_columns(column_name, udt_name, is_nullable) AS (
  VALUES
    ('id', 'uuid', 'NO'),
    ('invite_code_id', 'uuid', 'NO'),
    ('user_id', 'uuid', 'NO'),
    ('granted_access_status', 'text', 'NO'),
    ('redeemed_at', 'timestamptz', 'NO')
),
catalog_facts AS (
  SELECT
    to_regclass('public.profiles') IS NOT NULL AS profiles_exists,
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'access_status'
        AND data_type = 'text'
        AND is_nullable = 'NO'
        AND column_default = '''WAITLIST''::text'
    ) AS access_status_contract,
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
    ) AS access_status_named_contract,
    to_regclass('public.invite_codes') IS NOT NULL AS invite_codes_exists,
    (SELECT count(*)
      FROM required_invite_columns expected
      JOIN information_schema.columns actual
        ON actual.table_schema = 'public'
       AND actual.table_name = 'invite_codes'
       AND actual.column_name = expected.column_name
       AND actual.udt_name = expected.udt_name
       AND actual.is_nullable = expected.is_nullable) AS invite_column_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND cmd = 'UPDATE'
        AND policyname <> 'Usuários podem atualizar seu próprio perfil')
      AS unknown_profile_update_policy_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'invite_codes'
        AND policyname NOT IN (
          'Admins can manage invite codes',
          'Anyone can read invite codes to validate'
        )) AS unknown_invite_policy_count,
    (SELECT count(*)
      FROM required_application_columns expected
      JOIN information_schema.columns actual
        ON actual.table_schema = 'public'
       AND actual.table_name = 'early_access_applications'
       AND actual.column_name = expected.column_name
       AND actual.udt_name = expected.udt_name
       AND actual.is_nullable = expected.is_nullable) AS application_column_count,
    (SELECT count(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND c.relname IN (
          'early_access_applications',
          'invite_code_redemptions'
        )) AS new_table_count,
    (SELECT count(*)
      FROM required_redemption_columns expected
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
      FROM (VALUES
        ('public.prepare_early_access_application()'),
        ('public.protect_access_status()'),
        ('public.redeem_early_access_invite(text,uuid)')
      ) AS expected(signature)
      WHERE to_regprocedure(expected.signature) IS NOT NULL) AS function_count,
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
    (SELECT count(*)
      FROM pg_catalog.pg_trigger t
      WHERE NOT t.tgisinternal
        AND (
          (t.tgrelid = to_regclass('public.profiles')
            AND t.tgname = 'protect_access_status_trigger')
          OR
          (t.tgrelid = to_regclass('public.early_access_applications')
            AND t.tgname = 'prepare_early_access_application_trigger')
        )) AS trigger_count,
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
    (SELECT count(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'early_access_applications',
          'invite_code_redemptions',
          'invite_codes'
        )
        AND c.relrowsecurity) AS rls_table_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'early_access_applications',
          'invite_code_redemptions',
          'invite_codes'
        )) AS server_table_policy_count,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND cmd = 'UPDATE') AS profile_update_policy_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'early_access_applications',
          'invite_code_redemptions',
          'invite_codes'
        )
        AND grantee IN ('PUBLIC', 'anon', 'authenticated')) AS client_server_table_grant_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND privilege_type = 'UPDATE'
        AND grantee IN ('PUBLIC', 'anon', 'authenticated')) AS client_profile_update_grant_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'early_access_applications',
          'invite_code_redemptions',
          'invite_codes'
        )
        AND grantee = 'service_role'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
      AS service_table_grant_count
),
data_query AS (
  SELECT CASE
    WHEN profiles_exists AND access_status_contract AND invite_codes_exists
      AND invite_column_count = 9
    THEN query_to_xml(
      $data_contract_query$
        SELECT
          (SELECT count(*)
           FROM public.profiles
           WHERE access_status NOT IN (
             'WAITLIST', 'INVITED', 'BETA_TESTER',
             'ACTIVE', 'SUSPENDED', 'BANNED'
           ))::bigint AS invalid_access_status_count,
          (SELECT count(*)
           FROM public.invite_codes
           WHERE btrim(code) = ''
              OR max_uses <= 0
              OR current_uses < 0
              OR current_uses > max_uses
              OR target_role NOT IN ('BETA_TESTER', 'ACTIVE'))::bigint
            AS invalid_invite_count
      $data_contract_query$,
      true,
      false,
      ''
    )
    ELSE NULL::xml
  END AS result
  FROM catalog_facts
),
data_facts AS (
  SELECT
    COALESCE(
      ((xpath('/table/row/invalid_access_status_count/text()', result))[1]::text)::bigint,
      0
    ) AS invalid_access_status_count,
    COALESCE(
      ((xpath('/table/row/invalid_invite_count/text()', result))[1]::text)::bigint,
      0
    ) AS invalid_invite_count
  FROM data_query
),
facts AS (
  SELECT catalog_facts.*, data_facts.*,
    (
      application_column_count
      + redemption_column_count
      + function_count
      + trigger_count
      + new_table_count
    ) AS new_object_signal
  FROM catalog_facts
  CROSS JOIN data_facts
)
SELECT
  CASE
    WHEN NOT profiles_exists
      OR NOT access_status_contract
      OR NOT invite_codes_exists
      OR invite_column_count <> 9
      OR invalid_access_status_count > 0
      OR invalid_invite_count > 0
      OR unknown_profile_update_policy_count > 0
      OR unknown_invite_policy_count > 0
      THEN 'BLOCKED'
    WHEN new_object_signal = 0
      THEN 'SAFE_TO_APPLY'
    WHEN application_column_count = 17
      AND new_table_count = 2
      AND redemption_column_count = 5
      AND expected_constraint_count = 14
      AND access_status_named_contract
      AND function_count = 3
      AND access_function_contract
      AND application_function_contract
      AND redeem_function_contract
      AND trigger_count = 2
      AND access_trigger_contract
      AND application_trigger_contract
      AND rls_table_count = 3
      AND server_table_policy_count = 0
      AND profile_update_policy_count = 0
      AND client_server_table_grant_count = 0
      AND client_profile_update_grant_count = 0
      AND service_table_grant_count = 12
      THEN 'ALREADY_APPLIED'
    ELSE 'PARTIAL_STATE'
  END AS classification,
  facts.*
FROM facts;

-- Read-only inventory for manual review. No row data or invite codes returned.
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'invite_codes',
    'early_access_applications',
    'invite_code_redemptions'
  )
ORDER BY tablename, policyname;
