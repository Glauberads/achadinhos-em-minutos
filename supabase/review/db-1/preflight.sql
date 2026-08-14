-- DB-1 preflight (READ ONLY)
-- Run before the migration. Expected result on the audited production state:
-- classification = SAFE_TO_APPLY.

WITH expected_tables(table_name) AS (
  VALUES
    ('ai_providers'),
    ('ai_provider_credentials'),
    ('ai_provider_models'),
    ('ai_capability_routes')
),
expected_columns(table_name, column_name, udt_name, is_nullable, column_default) AS (
  VALUES
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
),
expected_constraints(table_name, constraint_name, constraint_type) AS (
  VALUES
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
),
facts AS (
  SELECT
    to_regclass('public.profiles') IS NOT NULL AS profiles_exists,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'platform_role'
    ) AS platform_role_exists,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'platform_role'
        AND data_type = 'text'
        AND is_nullable = 'YES'
        AND column_default IS NULL
    ) AS platform_role_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint con
      WHERE con.conrelid = to_regclass('public.profiles')
        AND con.conname = 'chk_platform_role'
        AND con.contype = 'c'
        AND con.convalidated
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role IS NULL%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role = ''superadmin''::text%'
    ) AS platform_role_constraint_contract,
    (SELECT count(*) FROM expected_tables e
      WHERE to_regclass('public.' || e.table_name) IS NOT NULL) AS ai_tables_present,
    (SELECT count(*) FROM expected_columns e
      JOIN information_schema.columns c
        ON c.table_schema = 'public'
       AND c.table_name = e.table_name
       AND c.column_name = e.column_name
       AND c.udt_name = e.udt_name
       AND c.is_nullable = e.is_nullable
       AND c.column_default IS NOT DISTINCT FROM e.column_default) AS expected_columns_present,
    (SELECT count(*) FROM expected_constraints e
      JOIN pg_catalog.pg_class c ON c.relname = e.table_name
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_catalog.pg_constraint con
        ON con.conrelid = c.oid
       AND con.conname = e.constraint_name
       AND con.contype = e.constraint_type::"char"
       AND con.convalidated) AS expected_constraints_present,
    to_regprocedure('public.protect_platform_role()') IS NOT NULL AS function_exists,
    EXISTS (
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
    ) AS function_contract,
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = to_regclass('public.profiles')
        AND t.tgname = 'protect_platform_role_trigger'
        AND NOT t.tgisinternal
        AND t.tgenabled <> 'D'
        AND t.tgfoid = to_regprocedure('public.protect_platform_role()')
        AND t.tgtype = 19
        AND t.tgattr::text = (
          SELECT a.attnum::text
          FROM pg_catalog.pg_attribute a
          WHERE a.attrelid = to_regclass('public.profiles')
            AND a.attname = 'platform_role'
            AND NOT a.attisdropped
        )
    ) AS trigger_exists,
    (SELECT count(*) FROM pg_catalog.pg_indexes
      WHERE schemaname = 'public'
        AND (
          (indexname = 'idx_ai_capability_routes_primary_model_provider'
            AND indexdef LIKE '%(primary_model_id, primary_provider_id)%')
          OR
          (indexname = 'idx_ai_capability_routes_fallback_model_provider'
            AND indexdef LIKE '%(fallback_model_id, fallback_provider_id)%'
            AND indexdef LIKE '%WHERE (fallback_model_id IS NOT NULL)%')
        )) AS route_index_count,
    (SELECT count(*)
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (SELECT table_name FROM expected_tables)
        AND c.relrowsecurity) AS rls_tables,
    (SELECT count(*)
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (SELECT table_name FROM expected_tables)) AS policy_count,
    (SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (SELECT table_name FROM expected_tables)
        AND grantee IN ('anon', 'authenticated')) AS client_grant_count
    ,(SELECT count(*)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (SELECT table_name FROM expected_tables)
        AND grantee = 'service_role'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) AS service_grant_count
)
SELECT
  CASE
    WHEN NOT profiles_exists THEN 'BLOCKED'
    WHEN NOT platform_role_exists
      AND ai_tables_present = 0
      AND NOT function_exists
      AND NOT trigger_exists
      AND expected_constraints_present = 0
      THEN 'SAFE_TO_APPLY'
    WHEN platform_role_contract
      AND platform_role_constraint_contract
      AND ai_tables_present = 4
      AND expected_columns_present = 29
      AND expected_constraints_present = 22
      AND function_exists
      AND function_contract
      AND trigger_exists
      AND route_index_count = 2
      AND rls_tables = 4
      AND policy_count = 0
      AND client_grant_count = 0
      AND service_grant_count = 16
      THEN 'ALREADY_APPLIED'
    ELSE 'PARTIAL_STATE'
  END AS classification,
  profiles_exists,
  platform_role_exists,
  platform_role_contract,
  platform_role_constraint_contract,
  ai_tables_present,
  expected_columns_present,
  expected_constraints_present,
  function_exists,
  function_contract,
  trigger_exists,
  route_index_count,
  rls_tables,
  policy_count,
  client_grant_count,
  service_grant_count
FROM facts;

-- Aggregate identity mapping without exposing email or user identifiers.
-- query_to_xml defers parsing the profile query until runtime, so a completely
-- absent public.profiles table can also be reported without undefined-table or
-- undefined-column errors. to_jsonb(p) makes platform_role optional.
WITH auth_facts AS (
  SELECT count(*)::bigint AS auth_users_count
  FROM auth.users
),
profile_query AS (
  SELECT CASE
    WHEN to_regclass('public.profiles') IS NULL THEN NULL::xml
    ELSE query_to_xml(
      $identity_query$
        SELECT
          count(p.id)::bigint AS profiles_matched_count,
          count(*) FILTER (WHERE p.id IS NULL)::bigint AS missing_profiles_count,
          count(*) FILTER (
            WHERE NULLIF(to_jsonb(p) ->> 'platform_role', '') IS NOT NULL
          )::bigint AS platform_role_non_null_count
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
      $identity_query$,
      true,
      false,
      ''
    )
  END AS result
),
profile_facts AS (
  SELECT
    COALESCE(
      ((xpath('/table/row/profiles_matched_count/text()', result))[1]::text)::bigint,
      0
    ) AS profiles_matched_count,
    COALESCE(
      ((xpath('/table/row/missing_profiles_count/text()', result))[1]::text)::bigint,
      (SELECT auth_users_count FROM auth_facts)
    ) AS missing_profiles_count,
    COALESCE(
      ((xpath('/table/row/platform_role_non_null_count/text()', result))[1]::text)::bigint,
      0
    ) AS platform_role_non_null_count
  FROM profile_query
)
SELECT
  auth_facts.auth_users_count,
  profile_facts.profiles_matched_count,
  profile_facts.missing_profiles_count,
  profile_facts.platform_role_non_null_count
FROM auth_facts
CROSS JOIN profile_facts;
