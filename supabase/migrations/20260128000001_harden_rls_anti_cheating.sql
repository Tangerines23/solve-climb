-- ============================================================================
-- 보안 강화 마이그레이션 (안티 치트)
-- 작성일: 2026.01.28
-- 목적: 유저가 직접 수치(점수, 미네랄 등)를 수정하는 것을 방지하고 서버 함수 사용 강제
-- ============================================================================

-- 1. profiles 테이블 보안 강화 (트리거를 통한 컬럼 레벨 보호)
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- 클라이언트(authenticated/anon) 권한으로 직접 업데이트가 시도될 경우를 체크
  -- (SECURITY DEFINER 함수의 서비스 롤을 통한 업데이트는 허용)
  IF (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
    -- 변경이 금지된 민감 컬럼을 체크
    IF (NEW.minerals IS DISTINCT FROM OLD.minerals) OR
       (NEW.stamina IS DISTINCT FROM OLD.stamina) OR
       (NEW.total_mastery_score IS DISTINCT FROM OLD.total_mastery_score) OR
       (NEW.current_tier_level IS DISTINCT FROM OLD.current_tier_level) OR
       (NEW.pending_cycle_score IS DISTINCT FROM OLD.pending_cycle_score) OR
       (NEW.cycle_promotion_pending IS DISTINCT FROM OLD.cycle_promotion_pending) THEN
      RAISE EXCEPTION 'Direct update of sensitive profile columns is NOT allowed. Please use official game functions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 설정
DROP TRIGGER IF EXISTS tr_check_profile_update_security ON public.profiles;
CREATE TRIGGER tr_check_profile_update_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update_security();

COMMENT ON FUNCTION public.check_profile_update_security() IS '유저가 직접 수치용 민감 컬럼을 수정하는 것을 방지하는 보안 트리거';

-- 2. user_level_records 테이블 보안 강화 (직접 수정 권한 회수)
-- 기존에는 업데이트가 가능했으나, 이제는 submit_game_result 함수를 통해서만 수정되어야 함
ALTER TABLE public.user_level_records ENABLE ROW LEVEL SECURITY;

-- 기존 UPDATE 정책 제거
DROP POLICY IF EXISTS "Users can update own records" ON public.user_level_records;

-- 조회만 가능하도록 설정
DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" 
  ON public.user_level_records FOR SELECT 
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_level_records IS '유저별 레벨 기록. 직접 UPDATE는 금지되며 RPC 함수를 통해서만 기록됨';

-- 3. inventory 테이블 보안 강화 (직접 수정 차단, RPC 강제)
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
-- 인벤토리는 조회만 가능하고 수량 변경은 purchase/consume RPC에서 처리
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" 
  ON public.inventory FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. 보안 감사 로그에 정책 강화 기록
INSERT INTO public.security_audit_log (event_type, event_data)
VALUES ('security_hardened', JSONB_build_object('reason', 'Anti-cheating hardening for profiles, records, and inventory'));
