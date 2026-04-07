-- ============================================================================
-- 디버그 RPC 보안 우회 추가
-- 작성일: 2026.04.06
-- 목적: tr_check_profile_update_security 트리거를 우회하여 stamina/minerals 수정 허용
-- ============================================================================

-- 1. debug_set_stamina 함수 수정
CREATE OR REPLACE FUNCTION public.debug_set_stamina(p_stamina INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 보안 트리거 바이패스 설정 (중요!)
  PERFORM set_config('app.bypass_profile_security', '1', true);

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

-- 2. debug_set_minerals 함수 수정
CREATE OR REPLACE FUNCTION public.debug_set_minerals(p_minerals INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 보안 트리거 바이패스 설정 (중요!)
  PERFORM set_config('app.bypass_profile_security', '1', true);

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
