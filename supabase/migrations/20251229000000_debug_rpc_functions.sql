-- ============================================================================
-- ?�버�?RPC ?�수 마이그레?�션
-- ?�성?? 2025.12.29
-- ?�️ 중요: 마이그레?�션 ?�일 ?�짜??기존 최신 ?�일(20251228000006)보다 ?�중?�어???�니??
-- ============================================================================

-- 1. 마스?�리 ?�수 ?�정
CREATE OR REPLACE FUNCTION public.debug_set_mastery_score(
  p_user_id UUID,
  p_score BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- ?�경 체크: 개발 ?�경?�서�??�동
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- ?�증 체크
  IF v_authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 체크: ?�신???�이?�만 조작 가??
  IF p_user_id != v_authenticated_user_id THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_authenticated_user_id, 'debug_unauthorized_access', 
            JSONB_build_object('attempted_user_id', p_user_id))
    ON CONFLICT DO NOTHING;
    RAISE EXCEPTION 'Permission denied: Cannot modify other user''s data';
  END IF;
  
  -- 마스?�리 ?�수 ?�데?�트
  UPDATE public.profiles
  SET total_mastery_score = p_score,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- ?�어 ?�동 ?�계??
  -- ?�️ 주의: update_user_tier??current_tier_level�??�데?�트
  -- stars??calculate_tier() ?�수??계산값이므�?별도 ?�데?�트 불필??
  PERFORM public.update_user_tier(p_user_id);
  
  RETURN JSONB_build_object('success', true, 'message', 'Mastery score updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ?�어 강제 ?�정
CREATE OR REPLACE FUNCTION public.debug_set_tier(
  p_user_id UUID,
  p_level INTEGER
  -- ?�️ 주의: p_stars ?�라미터 ?�거??
  -- stars??calculate_tier() 계산값이므�?별도 ?�??불필??
  -- stars�??�어?�려�?total_mastery_score�?조정?�여 간접 ?�어
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- ?�경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- ?�증 �?권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- ?�어 ?�보 ?�데?�트 (직접 ?�정)
  -- ?�️ 주의: ?�제 ?�로?�트??current_tier_level ?�용
  -- ?�️ tier_stars 컬럼?� 존재?��? ?�음 (stars??calculate_tier() 계산�?
  UPDATE public.profiles
  SET current_tier_level = p_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 참고: stars�??�어?�려�?total_mastery_score�?조정?�여 간접 ?�어
  -- ?? stars = 5�??�하�?total_mastery_score = 250000 * 5 + ?�하???�수
  
  RETURN JSONB_build_object('success', true, 'message', 'Tier updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 뱃�? 강제 ?�득
CREATE OR REPLACE FUNCTION public.debug_grant_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- ?�경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- ?�증 �?권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 뱃�? 부??(중복 체크)
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (p_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN JSONB_build_object('success', true, 'message', 'Badge granted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 뱃�? ?�거
CREATE OR REPLACE FUNCTION public.debug_remove_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- ?�경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- ?�증 �?권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- 뱃�? ?�거
  DELETE FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id = p_badge_id;
  
  RETURN JSONB_build_object('success', true, 'message', 'Badge removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ?�로??초기??
CREATE OR REPLACE FUNCTION public.debug_reset_profile(
  p_user_id UUID,
  p_reset_type TEXT -- 'all' | 'score' | 'minerals' | 'tier'
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- ?�경 체크
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;
  
  -- ?�증 �?권한 체크
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- ?�택??초기??
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
  
  RETURN JSONB_build_object('success', true, 'message', 'Profile reset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

