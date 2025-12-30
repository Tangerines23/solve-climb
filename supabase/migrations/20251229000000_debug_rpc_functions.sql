-- ============================================================================
-- 디버그 RPC 함수 마이그레이션
-- 작성일: 2025.12.29
-- ⚠️ 중요: 마이그레이션 파일 날짜는 기존 최신 파일(20251228000006)보다 나중이어야 합니다.
-- ============================================================================

-- 1. 마스터리 점수 설정
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
  -- ⚠️ 주의: update_user_tier는 current_tier_level만 업데이트
  -- stars는 calculate_tier() 함수의 계산값이므로 별도 업데이트 불필요
  PERFORM public.update_user_tier(p_user_id);
  
  RETURN json_build_object('success', true, 'message', 'Mastery score updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 티어 강제 설정
CREATE OR REPLACE FUNCTION public.debug_set_tier(
  p_user_id UUID,
  p_level INTEGER
  -- ⚠️ 주의: p_stars 파라미터 제거됨
  -- stars는 calculate_tier() 계산값이므로 별도 저장 불필요
  -- stars를 제어하려면 total_mastery_score를 조정하여 간접 제어
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
  -- ⚠️ 주의: 실제 프로젝트는 current_tier_level 사용
  -- ⚠️ tier_stars 컬럼은 존재하지 않음 (stars는 calculate_tier() 계산값)
  UPDATE public.profiles
  SET current_tier_level = p_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 참고: stars를 제어하려면 total_mastery_score를 조정하여 간접 제어
  -- 예: stars = 5를 원하면 total_mastery_score = 250000 * 5 + 원하는_점수
  
  RETURN json_build_object('success', true, 'message', 'Tier updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 뱃지 강제 획득
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

-- 4. 뱃지 제거
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

-- 5. 프로필 초기화
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

