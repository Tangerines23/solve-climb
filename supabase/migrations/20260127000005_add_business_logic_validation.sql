-- ============================================================================
-- Phase 6: 비즈?�스 로직 검�?(Business Logic Validation)
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_business_logic_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: Check Mastery Score Integrity
  -- Verifies that profiles.total_mastery_score matches the sum of user_level_records.best_score
  RETURN QUERY
  WITH calculated_scores AS (
      SELECT user_id, COALESCE(SUM(best_score), 0)::BIGINT as expected_score
      FROM public.user_level_records
      GROUP BY user_id
  ),
  mismatches AS (
      SELECT 
          p.id as user_id,
          p.nickname,
          p.total_mastery_score as actual_score,
          COALESCE(cs.expected_score, 0) as expected_score
      FROM public.profiles p
      LEFT JOIN calculated_scores cs ON p.id = cs.user_id
      WHERE p.total_mastery_score != COALESCE(cs.expected_score, 0)
  )
  SELECT 
    'check_mastery_integrity'::TEXT,
    (SELECT COUNT(*) = 0 FROM mismatches),
    CASE 
      WHEN (SELECT COUNT(*) FROM mismatches) = 0 
      THEN 'All mastery scores match record sums'
      ELSE 'Found profiles with incorrect mastery scores'
    END::TEXT,
    (SELECT JSONB_build_object(
      'count', COUNT(*),
      'mismatches', JSONB_agg(JSONB_build_object(
          'user_id', user_id,
          'nickname', nickname,
          'actual', actual_score,
          'expected', expected_score
      ))
    ) FROM mismatches);

END;
$$ LANGUAGE plpgsql;

-- Update Main Validation Function to include Phase 6
CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- 1. Basic Constraints
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

  -- 2. Advanced Logic
  RETURN QUERY SELECT * FROM test_db_advanced_validation();

  -- 3. RPC Integrity
  RETURN QUERY SELECT * FROM test_db_rpc_validation();

  -- 4. Security
  RETURN QUERY SELECT * FROM test_db_security_validation();

  -- 5. Performance
  RETURN QUERY SELECT * FROM test_db_performance_validation();

  -- 6. JSON Integrity
  RETURN QUERY SELECT * FROM test_db_json_validation();

  -- 7. Business Logic (NEW)
  RETURN QUERY SELECT * FROM test_db_business_logic_validation();
END;
$$ LANGUAGE plpgsql;
