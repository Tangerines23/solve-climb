-- ============================================================================
-- 고급 DB 검증 시스템 마이그레이션
-- 작성일: 2026.01.26
-- 목적: 비즈니스 로직 및 데이터 일관성 검증 추가
-- ============================================================================

-- ============================================================================
-- 고급 검증 함수 생성
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_advanced_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: 만료된 게임 세션 체크 (24시간 이상 pending 상태)
  RETURN QUERY
  SELECT 
    'check_expired_sessions'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.game_sessions 
     WHERE status = 'pending' 
     AND created_at < NOW() - INTERVAL '24 hours'),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.game_sessions 
            WHERE status = 'pending' 
            AND created_at < NOW() - INTERVAL '24 hours') = 0 
      THEN 'No expired pending sessions'
      ELSE 'Found expired pending sessions'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*),
      'oldest', MIN(created_at)
    ) FROM public.game_sessions 
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours');

  -- Test 2: 고아 레코드 체크 (inventory의 user_id가 profiles에 없음)
  RETURN QUERY
  SELECT 
    'check_orphan_inventory'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory i
     WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = i.user_id)),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.inventory i
            WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = i.user_id)) = 0 
      THEN 'No orphan inventory records'
      ELSE 'Found orphan inventory records'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*)
    ) FROM public.inventory i
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = i.user_id));

  -- Test 3: 중복 인벤토리 체크 (같은 user_id + item_id 조합)
  RETURN QUERY
  SELECT 
    'check_duplicate_inventory'::TEXT,
    (SELECT COUNT(*) = 0 FROM (
      SELECT user_id, item_id, COUNT(*) as cnt
      FROM public.inventory
      GROUP BY user_id, item_id
      HAVING COUNT(*) > 1
    ) duplicates),
    CASE 
      WHEN (SELECT COUNT(*) FROM (
            SELECT user_id, item_id, COUNT(*) as cnt
            FROM public.inventory
            GROUP BY user_id, item_id
            HAVING COUNT(*) > 1
          ) duplicates) = 0 
      THEN 'No duplicate inventory records'
      ELSE 'Found duplicate inventory records'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*)
    ) FROM (
      SELECT user_id, item_id, COUNT(*) as cnt
      FROM public.inventory
      GROUP BY user_id, item_id
      HAVING COUNT(*) > 1
    ) duplicates);

  -- Test 4: 미래 날짜 체크 (updated_at이 미래)
  RETURN QUERY
  SELECT 
    'check_future_timestamps'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE updated_at > NOW() + INTERVAL '1 hour'),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles WHERE updated_at > NOW() + INTERVAL '1 hour') = 0 
      THEN 'No future timestamps in profiles'
      ELSE 'Found future timestamps'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*)
    ) FROM public.profiles WHERE updated_at > NOW() + INTERVAL '1 hour');

  -- Test 5: 음수 점수 체크
  RETURN QUERY
  SELECT 
    'check_negative_scores'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.user_level_records WHERE best_score < 0),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_level_records WHERE best_score < 0) = 0 
      THEN 'No negative scores in level records'
      ELSE 'Found negative scores'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*),
      'min_score', MIN(best_score)
    ) FROM public.user_level_records WHERE best_score < 0);

  -- Test 6: 비정상적으로 높은 점수 체크 (10억 이상)
  RETURN QUERY
  SELECT 
    'check_abnormal_scores'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.user_level_records WHERE best_score > 1000000000),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_level_records WHERE best_score > 1000000000) = 0 
      THEN 'No abnormally high scores'
      ELSE 'Found abnormally high scores'
    END::TEXT,
    (SELECT jsonb_build_object(
      'count', COUNT(*),
      'max_score', MAX(best_score)
    ) FROM public.user_level_records WHERE best_score > 1000000000);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 통합 검증 함수 (기본 + 고급)
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- 기본 검증 (4개)
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

  -- 고급 검증 (6개)
  RETURN QUERY
  SELECT * FROM test_db_advanced_validation();
END;
$$ LANGUAGE plpgsql;
