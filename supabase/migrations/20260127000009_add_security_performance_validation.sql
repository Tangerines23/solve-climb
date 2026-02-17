-- ============================================================================
-- Phase 4: 보안 �??�능 검�??�스??(Security & Performance Validation)
-- ============================================================================

-- 1. Fix identified security gap: Enable RLS on mode_mapping
-- mode_mapping is public read-only, but should have RLS enabled for consistency and safety.
ALTER TABLE public.mode_mapping ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mode_mapping' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.mode_mapping
            FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Security Validation Function
CREATE OR REPLACE FUNCTION test_db_security_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: Check if RLS is enabled on all tables in public schema
  RETURN QUERY
  SELECT 
    'check_rls_enabled'::TEXT,
    (SELECT COUNT(*) = 0 FROM pg_tables 
     WHERE schemaname = 'public' 
     AND rowsecurity = false),
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) = 0 
      THEN 'All public tables have RLS enabled'
      ELSE 'Found tables with RLS disabled'
    END::TEXT,
    (SELECT JSONB_build_object(
      'tables_without_rls', JSONB_agg(tablename)
    ) FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = false);

END;
$$ LANGUAGE plpgsql;

-- 3. Performance Validation Function
CREATE OR REPLACE FUNCTION test_db_performance_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: Check for unindexed foreign keys
  -- Unindexed foreign keys can cause performance issues during joins and deletes (locking)
  RETURN QUERY
  WITH unindexed_fks AS (
      SELECT
          c.conname AS constraint_name,
          t.relname AS table_name,
          a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = t.oid
      LEFT JOIN pg_index i ON i.indrelid = c.conrelid AND i.indkey::int[] @> c.conkey::int[]
      WHERE c.contype = 'f'
      AND i.indexrelid IS NULL
      AND c.connamespace = 'public'::regnamespace
  )
  SELECT 
    'check_unindexed_foreign_keys'::TEXT,
    (SELECT COUNT(*) = 0 FROM unindexed_fks),
    CASE 
      WHEN (SELECT COUNT(*) FROM unindexed_fks) = 0 
      THEN 'All foreign keys are indexed'
      ELSE 'Found unindexed foreign keys'
    END::TEXT,
    (SELECT JSONB_build_object(
      'unindexed_constraints', JSONB_agg(JSONB_build_object(
        'table', table_name,
        'constraint', constraint_name,
        'column', column_name
      ))
    ) FROM unindexed_fks);

END;
$$ LANGUAGE plpgsql;

-- 4. Update Main Validation Function (test_db_all_validations)
CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Basic Constraints Checks (From Phase 1)
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE stamina < 0 OR stamina > 10));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- Advanced Logic Checks (From Phase 2)
  RETURN QUERY SELECT * FROM test_db_advanced_validation();

  -- RPC Integrity Checks (From Phase 3)
  RETURN QUERY SELECT * FROM test_db_rpc_validation();

  -- Security Checks (From Phase 4 - NEW)
  RETURN QUERY SELECT * FROM test_db_security_validation();

  -- Performance Checks (From Phase 4 - NEW)
  RETURN QUERY SELECT * FROM test_db_performance_validation();
END;
$$ LANGUAGE plpgsql;
