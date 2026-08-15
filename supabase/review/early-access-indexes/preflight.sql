-- Preflight check for early access indexes migration
-- READ-ONLY: No writes, no DML, no DDL
-- Classifies state as: SAFE_TO_APPLY | ALREADY_APPLIED | PARTIAL_STATE | BLOCKED

-- Check existing indexes on invite_code_redemptions
SELECT 
    'invite_code_redemptions' as table_name,
    'idx_invite_code_redemptions_invite_code_id' as expected_index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class i
            JOIN pg_index ix ON i.oid = ix.indexrelid
            JOIN pg_class t ON ix.indrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'invite_code_redemptions'
              AND i.relname = 'idx_invite_code_redemptions_invite_code_id'
              AND n.nspname = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- Check existing indexes on invite_codes
SELECT 
    'invite_codes' as table_name,
    'idx_invite_codes_created_by' as expected_index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class i
            JOIN pg_index ix ON i.oid = ix.indexrelid
            JOIN pg_class t ON ix.indrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE t.relname = 'invite_codes'
              AND i.relname = 'idx_invite_codes_created_by'
              AND n.nspname = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- Classify overall state
DO $$
DECLARE
    idx1_exists boolean;
    idx2_exists boolean;
    classification text;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = 'invite_code_redemptions'
          AND i.relname = 'idx_invite_code_redemptions_invite_code_id'
          AND n.nspname = 'public'
    ) INTO idx1_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_class i
        JOIN pg_index ix ON i.oid = ix.indexrelid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = 'invite_codes'
          AND i.relname = 'idx_invite_codes_created_by'
          AND n.nspname = 'public'
    ) INTO idx2_exists;
    
    IF idx1_exists AND idx2_exists THEN
        classification := 'ALREADY_APPLIED';
    ELSIF NOT idx1_exists AND NOT idx2_exists THEN
        classification := 'SAFE_TO_APPLY';
    ELSE
        classification := 'PARTIAL_STATE';
    END IF;
    
    RAISE NOTICE 'PREFLIGHT_CLASSIFICATION: %', classification;
END $$;