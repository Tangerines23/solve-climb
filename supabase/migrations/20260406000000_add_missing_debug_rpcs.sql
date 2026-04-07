-- ============================================================================
-- 누락된 디버그 RPC 함수 추가
-- 작성일: 2026.04.06
-- 목적: Simple Dev (백틱 키) 동작 시 필요한 stamina/minerals 업데이트 함수 추가
-- ============================================================================

-- 1. debug_set_stamina 함수 추가
CREATE OR REPLACE FUNCTION public.debug_set_stamina(p_stamina INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 디버그 모드 활성화 여부 확인
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  -- 인증 확인
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 프로필 업데이트
  UPDATE public.profiles
  SET stamina = p_stamina,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN JSONB_build_object('success', true, 'message', 'Stamina updated to ' || p_stamina);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. debug_set_minerals 함수 추가
CREATE OR REPLACE FUNCTION public.debug_set_minerals(p_minerals INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 디버그 모드 활성화 여부 확인
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  -- 인증 확인
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 프로필 업데이트
  UPDATE public.profiles
  SET minerals = p_minerals,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN JSONB_build_object('success', true, 'message', 'Minerals updated to ' || p_minerals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION public.debug_set_stamina(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_minerals(INTEGER) TO authenticated;

-- 4. 주석 추가
COMMENT ON FUNCTION public.debug_set_stamina IS '스태미나를 강제로 설정합니다. (디버그 전용)';
COMMENT ON FUNCTION public.debug_set_minerals IS '미네랄을 강제로 설정합니다. (디버그 전용)';
