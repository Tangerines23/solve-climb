-- ============================================================================
-- DB 검증 시스템 마이그레이션
-- 작성일: 2026.01.26
-- 목적: 데이터 무결성 보장 및 자동 검증 시스템 구축
-- ============================================================================

-- ============================================================================
-- Phase 1: 데이터 제약조건 추가
-- ============================================================================

-- profiles 테이블 검증
ALTER TABLE public.profiles 
  ADD CONSTRAINT check_minerals_non_negative 
  CHECK (minerals >= 0);

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_stamina_range 
  CHECK (stamina >= 0 AND stamina <= 10);

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_tier_level_range 
  CHECK (current_tier_level >= 0 AND current_tier_level <= 100);

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_mastery_score_non_negative 
  CHECK (total_mastery_score >= 0);

-- inventory 테이블 검증
ALTER TABLE public.inventory 
  ADD CONSTRAINT check_quantity_positive 
  CHECK (quantity > 0);

-- game_records 테이블 검증
ALTER TABLE public.game_records 
  ADD CONSTRAINT check_score_non_negative 
  CHECK (score >= 0);

ALTER TABLE public.game_records 
  ADD CONSTRAINT check_level_positive 
  CHECK (level > 0);

-- ============================================================================
-- Phase 2: 트리거 기반 자동 정리
-- ============================================================================

-- 아이템 소모 시 자동으로 quantity=0인 항목 삭제
CREATE OR REPLACE FUNCTION cleanup_empty_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    DELETE FROM public.inventory WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_empty_inventory
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_empty_inventory();

-- ============================================================================
-- Phase 3: 자동 테스트 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_constraints()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT) AS $$
BEGIN
  -- Test 1: minerals는 음수가 될 수 없음
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT;

  -- Test 2: stamina는 0-10 범위
  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT;

  -- Test 3: inventory quantity는 양수
  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT;

  -- Test 4: tier level은 0-100 범위
  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 검증: 테스트 실행
-- ============================================================================

SELECT * FROM test_db_constraints();
