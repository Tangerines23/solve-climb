-- ============================================================================
-- 디버그 모드 설정 스크립트
-- 작성일: 2025.01.01
-- 설명: 디버그 모드 기능을 사용하기 위한 모든 DB 설정을 적용합니다.
-- 사용법: Supabase Dashboard의 SQL Editor에서 실행하세요.
-- ⚠️ 주의: 프로덕션 환경에서는 실행하지 마세요!
-- ============================================================================

-- 1. game_config 테이블이 없는 경우 생성
CREATE TABLE IF NOT EXISTS public.game_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. debug_mode_enabled 설정 추가/업데이트
-- 개발 환경에서는 true로 설정 (필요시 수동으로 변경)
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'true', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE 
SET value = 'true', 
    updated_at = NOW();

-- 3. game_sessions 테이블에 is_debug_session 컬럼 추가 (없는 경우)
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS is_debug_session BOOLEAN DEFAULT false;

-- 4. is_debug_session 컬럼에 코멘트 추가
COMMENT ON COLUMN public.game_sessions.is_debug_session IS 
  '디버그 모드로 생성된 세션인지 여부. 무한 스태미나 등 디버그 기능 사용 시 true';

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_game_sessions_debug 
ON public.game_sessions(is_debug_session) 
WHERE is_debug_session = true;

-- 6. 디버그 RPC 함수들 생성
-- 6.1. 마스터리 점수 설정
CREATE OR REPLACE FUNCTION public.debug_set_mastery_score(
  p_user_id UUID,
  p_score BIGINT
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 환경 체크: 개발 환경에서만 작동
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- 인증 체크
  IF v_authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 체크: 자신의 데이터만 조작 가능
  IF p_user_id != v_authenticated_user_id THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_authenticated_user_id, 'debug_unauthorized_access', 
            json_build_object('attempted_user_id', p_user_id))
    ON CONFLICT DO NOTHING;
    RAISE EXCEPTION 'Permission denied: Cannot modify other user''s data';
  END IF;
  
  -- 마스터리 점수 업데이트
  UPDATE public.profiles
  SET total_mastery_score = p_score,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 티어 자동 재계산
  PERFORM public.update_user_tier(p_user_id);
  
  RETURN json_build_object('success', true, 'message', 'Mastery score updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2. 티어 강제 설정
CREATE OR REPLACE FUNCTION public.debug_set_tier(
  p_user_id UUID,
  p_level INTEGER
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 환경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- 인증 및 권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 티어 정보 업데이트 (직접 설정)
  UPDATE public.profiles
  SET current_tier_level = p_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Tier updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3. 뱃지 강제 획득
CREATE OR REPLACE FUNCTION public.debug_grant_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 환경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- 인증 및 권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 뱃지 부여 (중복 체크)
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (p_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN json_build_object('success', true, 'message', 'Badge granted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4. 뱃지 제거
CREATE OR REPLACE FUNCTION public.debug_remove_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 환경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- 인증 및 권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 뱃지 제거
  DELETE FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id = p_badge_id;
  
  RETURN json_build_object('success', true, 'message', 'Badge removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5. 프로필 초기화
CREATE OR REPLACE FUNCTION public.debug_reset_profile(
  p_user_id UUID,
  p_reset_type TEXT -- 'all' | 'score' | 'minerals' | 'tier'
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 환경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- 인증 및 권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 선택적 초기화
  CASE p_reset_type
    WHEN 'all' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          minerals = 0,
          stamina = 5,
          updated_at = NOW()
      WHERE id = p_user_id;
    WHEN 'score' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
      PERFORM public.update_user_tier(p_user_id);
    WHEN 'minerals' THEN
      UPDATE public.profiles
      SET minerals = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    WHEN 'tier' THEN
      UPDATE public.profiles
      SET current_tier_level = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Invalid reset type';
  END CASE;
  
  RETURN json_build_object('success', true, 'message', 'Profile reset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 함수 권한 부여 (필요한 경우)
GRANT EXECUTE ON FUNCTION public.debug_set_mastery_score(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_tier(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_grant_badge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_remove_badge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_reset_profile(UUID, TEXT) TO authenticated;

-- 8. 설정 확인 쿼리
SELECT 
    '디버그 모드 설정' AS check_name,
    key,
    value,
    description
FROM public.game_config
WHERE key = 'debug_mode_enabled';

-- 9. 함수 생성 확인 쿼리
SELECT 
    'RPC 함수 확인' AS check_name,
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname LIKE 'debug_%'
ORDER BY proname;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '디버그 모드 설정이 완료되었습니다!';
    RAISE NOTICE 'debug_mode_enabled 값이 true인지 확인하세요.';
END $$;

