-- ============================================================================
-- Phase 5: JSON 데이터 무결성 검증 (JSON Schema Validation)
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_json_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: Check completed sessions have result JSON
  RETURN QUERY
  SELECT 
    'check_completed_session_results'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.game_sessions gs
     WHERE gs.status = 'completed' 
     AND (gs.result IS NULL OR jsonb_typeof(gs.result) = 'null')),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.game_sessions gs
            WHERE gs.status = 'completed' 
            AND (gs.result IS NULL OR jsonb_typeof(gs.result) = 'null')) = 0 
      THEN 'All completed sessions have valid result JSON'
      ELSE 'Found completed sessions with missing result'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*),
      'invalid_sessions', jsonb_agg(gs.id)
    ) FROM public.game_sessions gs
    WHERE gs.status = 'completed' 
    AND (gs.result IS NULL OR jsonb_typeof(gs.result) = 'null'));

  -- Test 2: Check all sessions have questions JSON
  RETURN QUERY
  SELECT 
    'check_session_questions_exist'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.game_sessions gs
     WHERE gs.questions IS NULL OR jsonb_typeof(gs.questions) = 'null'),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.game_sessions gs
            WHERE gs.questions IS NULL OR jsonb_typeof(gs.questions) = 'null') = 0 
      THEN 'All sessions have questions JSON'
      ELSE 'Found sessions with missing questions'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*)
    ) FROM public.game_sessions gs
    WHERE gs.questions IS NULL OR jsonb_typeof(gs.questions) = 'null');

END;
$$ LANGUAGE plpgsql;

-- Update Main Validation Function to include Phase 5
CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- 1. Basic Constraints
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE stamina < 0 OR stamina > 10));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- 2. Advanced Logic
  RETURN QUERY SELECT * FROM test_db_advanced_validation();

  -- 3. RPC Integrity
  RETURN QUERY SELECT * FROM test_db_rpc_validation();

  -- 4. Security
  RETURN QUERY SELECT * FROM test_db_security_validation();

  -- 5. Performance
  RETURN QUERY SELECT * FROM test_db_performance_validation();

  -- 6. JSON Integrity (NEW)
  RETURN QUERY SELECT * FROM test_db_json_validation();
END;
$$ LANGUAGE plpgsql;
