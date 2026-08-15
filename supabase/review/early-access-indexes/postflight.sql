-- Postflight validation for early access indexes migration
-- READ-ONLY: Validates both indexes exist with correct columns
-- Returns: POSTFLIGHT_PASS or POSTFLIGHT_FAIL

-- Validate idx_invite_code_redemptions_invite_code_id
SELECT 
    'invite_code_redemptions' as table_name,
    'idx_invite_code_redemptions_invite_code_id' as index_name,
    i.relname as found_index,
    a.attname as column_name,
    CASE 
        WHEN i.relname IS NOT NULL AND a.attname = 'invite_code_id' THEN 'VALID'
        WHEN i.relname IS NOT NULL THEN 'WRONG_COLUMN'
        ELSE 'MISSING'
    END as status
FROM pg_class i
RIGHT JOIN (
    SELECT 1 as dummy
) d ON true
LEFT JOIN pg_index ix ON i.oid = ix.indexrelid
LEFT JOIN pg_class t ON ix.indrelid = t.oid AND t.relname = 'invite_code_redemptions'
LEFT JOIN pg_namespace n ON t.relnamespace = n.oid AND n.nspname = 'public'
LEFT JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey) AND a.attname = 'invite_code_id'
WHERE i.relname = 'idx_invite_code_redemptions_invite_code_id'
UNION ALL
-- Validate idx_invite_codes_created_by
SELECT 
    'invite_codes' as table_name,
    'idx_invite_codes_created_by' as index_name,
    i.relname as found_index,
    a.attname as column_name,
    CASE 
        WHEN i.relname IS NOT NULL AND a.attname = 'created_by' THEN 'VALID'
        WHEN i.relname IS NOT NULL THEN 'WRONG_COLUMN'
        ELSE 'MISSING'
    END as status
FROM pg_class i
RIGHT JOIN (
    SELECT 1 as dummy
) d ON true
LEFT JOIN pg_index ix ON i.oid = ix.indexrelid
LEFT JOIN pg_class t ON ix.indrelid = t.oid AND t.relname = 'invite_codes'
LEFT JOIN pg_namespace n ON t.relnamespace = n.oid AND n.nspname = 'public'
LEFT JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey) AND a.attname = 'created_by'
WHERE i.relname = 'idx_invite_codes_created_by';

-- Final verdict
DO $$
DECLARE
    idx1_valid boolean;
    idx2_valid boolean;
    verdict text;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = 'invite_code_redemptions'
          AND i.relname = 'idx_invite_code_redemptions_invite_code_id'
          AND a.attname = 'invite_code_id'
          AND n.nspname = 'public'
    ) INTO idx1_valid;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = 'invite_codes'
          AND i.relname = 'idx_invite_codes_created_by'
          AND a.attname = 'created_by'
          AND n.nspname = 'public'
    ) INTO idx2_valid;
    
    IF idx1_valid AND idx2_valid THEN
        verdict := 'POSTFLIGHT_PASS';
    ELSE
        verdict := 'POSTFLIGHT_FAIL';
    END IF;
    
    RAISE NOTICE 'POSTFLIGHT_VERDICT: %', verdict;
END $$;