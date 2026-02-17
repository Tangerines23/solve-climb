-- ============================================================================
-- DB 검�??�스??마이그레?�션
-- ?�성?? 2026.01.26
-- 목적: ?�이??무결??보장 �??�동 검�??�스??구축
-- ============================================================================

-- ============================================================================
-- Phase 1: ?�이???�약조건 추�?
-- ============================================================================

-- profiles ?�이�?검�?(멱등: 기존 ?�약 ?�으�?건너?�)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_minerals_non_negative' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_minerals_non_negative CHECK (minerals >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_stamina_range' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_stamina_range CHECK (stamina >= 0 AND stamina <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_tier_level_range' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_tier_level_range CHECK (current_tier_level >= 0 AND current_tier_level <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_mastery_score_non_negative' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_mastery_score_non_negative CHECK (total_mastery_score >= 0);
  END IF;
END $$;

-- inventory ?�이�?검�?(멱등)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_quantity_positive' AND conrelid = 'public.inventory'::regclass) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);
  END IF;
END $$;

-- user_level_records ?�이�?검�?(멱등)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_score_non_negative' AND conrelid = 'public.user_level_records'::regclass) THEN
    ALTER TABLE public.user_level_records ADD CONSTRAINT check_score_non_negative CHECK (best_score >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_level_positive' AND conrelid = 'public.user_level_records'::regclass) THEN
    ALTER TABLE public.user_level_records ADD CONSTRAINT check_level_positive CHECK (level > 0);
  END IF;
END $$;

-- ============================================================================
-- Phase 2: ?�리�?기반 ?�동 ?�리
-- ============================================================================

-- ?�이???�모 ???�동?�로 quantity=0????�� ??��
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

DROP TRIGGER IF EXISTS trigger_cleanup_empty_inventory ON public.inventory;
CREATE TRIGGER trigger_cleanup_empty_inventory
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_empty_inventory();

-- ============================================================================
-- Phase 3: ?�동 ?�스???�수
-- ============================================================================

CREATE OR REPLACE FUNCTION test_db_constraints()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT) AS $$
BEGIN
  -- Test 1: minerals???�수가 ?????�음
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT;

  -- Test 2: stamina??0-10 범위
  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT;

  -- Test 3: inventory quantity???�수
  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT;

  -- Test 4: tier level?� 0-100 범위
  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 검�? ?�스???�행
-- ============================================================================

SELECT * FROM test_db_constraints();
