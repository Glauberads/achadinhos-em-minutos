-- DB-1 postflight (READ ONLY)
-- No user is promoted and no mutation is attempted by this script.

SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    (c.table_name = 'profiles' AND c.column_name = 'platform_role')
    OR c.table_name IN (
      'ai_providers',
      'ai_provider_credentials',
      'ai_provider_models',
      'ai_capability_routes'
    )
  )
ORDER BY c.table_name, c.ordinal_position;

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  COALESCE(p.policy_count, 0) AS policy_count,
  COALESCE(g.client_grant_count, 0) AS anon_authenticated_grant_count
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
    AND grantee IN ('anon', 'authenticated')
  GROUP BY table_name
) g ON g.table_name = c.relname
WHERE n.nspname = 'public'
  AND c.relname IN (
    'ai_providers',
    'ai_provider_credentials',
    'ai_provider_models',
    'ai_capability_routes'
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
    'ai_providers',
    'ai_provider_credentials',
    'ai_provider_models',
    'ai_capability_routes'
  )
ORDER BY c.relname, con.conname;

SELECT
  p.oid::regprocedure AS function_name,
  r.rolname AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS function_config,
  NOT has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute_revoked,
  NOT has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute_revoked,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
  p.prosrc LIKE '%auth.jwt()%' AS checks_request_jwt,
  p.prosrc LIKE '%session_user = ''postgres''%' AS allows_trusted_sql_editor,
  p.prosrc LIKE '%RAISE EXCEPTION%' AS rejects_untrusted_change
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
WHERE p.oid = to_regprocedure('public.protect_platform_role()');

SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS trigger_enabled,
  t.tgfoid::regprocedure AS trigger_function,
  pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
FROM pg_catalog.pg_trigger t
WHERE t.tgrelid = to_regclass('public.profiles')
  AND t.tgname = 'protect_platform_role_trigger'
  AND NOT t.tgisinternal;

WITH expected_columns(table_name, column_name, udt_name, is_nullable, column_default) AS (
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
      SELECT 1 FROM pg_catalog.pg_constraint con
      WHERE con.conrelid = to_regclass('public.profiles')
        AND con.conname = 'chk_platform_role'
        AND con.contype = 'c'
        AND con.convalidated
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role IS NULL%'
        AND pg_catalog.pg_get_constraintdef(con.oid, true) LIKE '%platform_role = ''superadmin''::text%'
    ) AS platform_role_constraint_contract,
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE platform_role IS NOT NULL
        AND platform_role <> 'superadmin'
    ) AS platform_role_data_valid,
    (SELECT count(*) FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'ai_providers',
          'ai_provider_credentials',
          'ai_provider_models',
          'ai_capability_routes'
        )
        AND c.relkind IN ('r', 'p')) AS table_count,
    (SELECT count(*) FROM expected_columns e
      JOIN information_schema.columns c
        ON c.table_schema = 'public'
       AND c.table_name = e.table_name
       AND c.column_name = e.column_name
       AND c.udt_name = e.udt_name
       AND c.is_nullable = e.is_nullable
       AND c.column_default IS NOT DISTINCT FROM e.column_default) AS expected_column_count,
    (SELECT count(*) FROM expected_constraints e
      JOIN pg_catalog.pg_class c ON c.relname = e.table_name
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_catalog.pg_constraint con
        ON con.conrelid = c.oid
       AND con.conname = e.constraint_name
       AND con.contype = e.constraint_type::"char"
       AND con.convalidated) AS expected_constraint_count,
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
    (SELECT count(*) FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'ai_providers',
          'ai_provider_credentials',
          'ai_provider_models',
          'ai_capability_routes'
        )
        AND c.relrowsecurity) AS rls_count,
    (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'ai_providers',
          'ai_provider_credentials',
          'ai_provider_models',
          'ai_capability_routes'
        )) AS policy_count,
    (SELECT count(*) FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'ai_providers',
          'ai_provider_credentials',
          'ai_provider_models',
          'ai_capability_routes'
        )
        AND grantee IN ('anon', 'authenticated')) AS client_grant_count,
    (SELECT count(*) FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN (
          'ai_providers',
          'ai_provider_credentials',
          'ai_provider_models',
          'ai_capability_routes'
        )
        AND grantee = 'service_role'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) AS service_grant_count,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_proc p
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
      SELECT 1 FROM pg_catalog.pg_trigger t
      WHERE t.tgrelid = to_regclass('public.profiles')
        AND t.tgname = 'protect_platform_role_trigger'
        AND t.tgenabled <> 'D'
        AND t.tgfoid = to_regprocedure('public.protect_platform_role()')
        AND NOT t.tgisinternal
        AND t.tgtype = 19
        AND t.tgattr::text = (
          SELECT a.attnum::text
          FROM pg_catalog.pg_attribute a
          WHERE a.attrelid = to_regclass('public.profiles')
            AND a.attname = 'platform_role'
            AND NOT a.attisdropped
        )
    ) AS trigger_contract
)
SELECT
  CASE
    WHEN platform_role_contract
      AND platform_role_constraint_contract
      AND platform_role_data_valid
      AND table_count = 4
      AND expected_column_count = 29
      AND expected_constraint_count = 22
      AND route_index_count = 2
      AND rls_count = 4
      AND policy_count = 0
      AND client_grant_count = 0
      AND service_grant_count = 16
      AND function_contract
      AND trigger_contract
    THEN 'POSTFLIGHT_PASS'
    ELSE 'POSTFLIGHT_FAIL'
  END AS postflight_status,
  facts.*
FROM facts;

-- Read-only user/profile mapping for the later bootstrap gate.
SELECT
  u.id AS auth_user_id,
  u.email,
  p.id AS profile_id,
  (p.id IS NOT NULL) AS has_matching_profile,
  p.platform_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at, u.id;
