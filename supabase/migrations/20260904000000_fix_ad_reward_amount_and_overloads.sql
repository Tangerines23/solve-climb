-- Migration: 20260904000000_fix_ad_reward_amount_and_overloads.sql
-- Description:
-- 1. Restore mineral_recharge reward to 500 minerals (matching UI & original design)
-- 2. Support dynamic p_amount for double_reward with secure clamping (50 ~ 1000)
-- 3. Maintain backward-compatible overloads for secure_reward_ad_view

DROP FUNCTION IF EXISTS public.secure_reward_ad_view(TEXT, UUID, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(
  p_ad_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_amount INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := COALESCE(auth.uid(), p_user_id);
  v_stamina INTEGER;
  v_minerals INTEGER;
  v_max_stamina CONSTANT INTEGER := 5;
  v_reward_minerals INTEGER := 500;
  v_profile_exists BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT stamina, minerals INTO v_stamina, v_minerals 
  FROM public.profiles 
  WHERE id = v_user_id 
  FOR UPDATE;

  v_profile_exists := FOUND;

  IF NOT v_profile_exists THEN
    INSERT INTO public.profiles (
      id, nickname, stamina, minerals, last_stamina_update, updated_at
    ) VALUES (
      v_user_id, '게이머', 5, 0, now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = EXCLUDED.updated_at;
      
    v_stamina := 5;
    v_minerals := 0;
  END IF;

  IF p_ad_type = 'stamina_recharge' THEN
    UPDATE public.profiles
    SET stamina = v_max_stamina,
        last_stamina_update = now(),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reward_type', 'stamina_recharge',
      'stamina', v_max_stamina,
      'message', '스태미나가 풀피(5개)로 완전히 회복되었습니다!'
    );

  ELSIF p_ad_type = 'mineral_recharge' THEN
    -- 상점 및 헤더 무료 충전: 원래 기획 및 UI(RECV_500_MINERALS)대로 500 미네랄 지급
    v_reward_minerals := 500;

    UPDATE public.profiles
    SET minerals = minerals + v_reward_minerals,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reward_type', p_ad_type,
      'reward_minerals', v_reward_minerals,
      'minerals', v_minerals + v_reward_minerals,
      'message', v_reward_minerals || ' 미네랄을 획득했습니다!'
    );

  ELSIF p_ad_type = 'double_reward' THEN
    -- 결과 화면 2배 보너스: 전달받은 점수 비례 미네랄이 있으면 보안 클램핑(50 ~ 1000) 적용, 없으면 기본 200 지급
    IF p_amount IS NOT NULL AND p_amount > 0 THEN
      v_reward_minerals := LEAST(GREATEST(p_amount, 50), 1000);
    ELSE
      v_reward_minerals := 200;
    END IF;

    UPDATE public.profiles
    SET minerals = minerals + v_reward_minerals,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reward_type', p_ad_type,
      'reward_minerals', v_reward_minerals,
      'minerals', v_minerals + v_reward_minerals,
      'message', v_reward_minerals || ' 미네랄을 획득했습니다!'
    );

  ELSE
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Invalid ad type');
  END IF;
END;
$$;

-- 하위 호환 오버로드: secure_reward_ad_view(p_ad_type TEXT)
CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(p_ad_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.secure_reward_ad_view(p_ad_type => p_ad_type, p_user_id => NULL, p_amount => NULL);
END;
$$;

-- 하위 호환 오버로드: secure_reward_ad_view(p_ad_type TEXT, p_user_id UUID)
CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(p_ad_type TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.secure_reward_ad_view(p_ad_type => p_ad_type, p_user_id => p_user_id, p_amount => NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.secure_reward_ad_view(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.secure_reward_ad_view(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.secure_reward_ad_view(TEXT, UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.secure_reward_ad_view(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.secure_reward_ad_view(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.secure_reward_ad_view(TEXT, UUID, INTEGER) TO authenticated, anon;
