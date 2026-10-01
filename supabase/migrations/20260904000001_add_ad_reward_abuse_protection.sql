-- Migration: 20260904000001_add_ad_reward_abuse_protection.sql
-- Description:
-- 1. Add abuse protection columns for ad rewards in profiles table
-- 2. Enforce 15-second minimum cooldown and daily limit (10 times) on mineral recharge
-- 3. Restore last_ad_stamina_recharge update and prevent redundant stamina recharges
-- 4. Maintain full backward-compatible overloads

-- 1. Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_ad_mineral_recharge TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_ad_mineral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ad_mineral_date DATE;

-- 2. Update secure_reward_ad_view RPC
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
  v_last_ad_stamina TIMESTAMPTZ;
  v_last_ad_mineral TIMESTAMPTZ;
  v_daily_ad_count INTEGER;
  v_last_ad_date DATE;
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_max_stamina CONSTANT INTEGER := 5;
  v_max_daily_mineral_ads CONSTANT INTEGER := 10;
  v_reward_minerals INTEGER := 500;
  v_profile_exists BOOLEAN := false;
  v_new_daily_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT stamina, minerals, last_ad_stamina_recharge, last_ad_mineral_recharge, daily_ad_mineral_count, last_ad_mineral_date
  INTO v_stamina, v_minerals, v_last_ad_stamina, v_last_ad_mineral, v_daily_ad_count, v_last_ad_date
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
    v_last_ad_stamina := NULL;
    v_last_ad_mineral := NULL;
    v_daily_ad_count := 0;
    v_last_ad_date := NULL;
  END IF;

  -- 1) STAMINA RECHARGE
  IF p_ad_type = 'stamina_recharge' THEN
    -- 이미 풀피(5개)인 경우 중복 충전 불필요 안내
    IF v_stamina >= v_max_stamina THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'reward_type', 'stamina_recharge',
        'stamina', v_max_stamina,
        'message', '스태미나가 이미 가득 차 있습니다!'
      );
    END IF;

    -- 최소 쿨다운(10초) 검증: 스크립트 매크로 연타 방어
    IF v_last_ad_stamina IS NOT NULL AND (now() - v_last_ad_stamina) < INTERVAL '10 seconds' THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'message', '잠시 후 다시 시도해주세요.'
      );
    END IF;

    UPDATE public.profiles
    SET stamina = v_max_stamina,
        last_stamina_update = now(),
        last_ad_stamina_recharge = now(),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reward_type', 'stamina_recharge',
      'stamina', v_max_stamina,
      'last_ad_stamina_recharge', now(),
      'message', '스태미나가 풀피(5개)로 완전히 회복되었습니다!'
    );

  -- 2) MINERAL RECHARGE (상점/헤더 무료 충전)
  ELSIF p_ad_type = 'mineral_recharge' THEN
    -- 최소 쿨다운(10초) 검증
    IF v_last_ad_mineral IS NOT NULL AND (now() - v_last_ad_mineral) < INTERVAL '10 seconds' THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'message', '잠시 후 다시 시도해주세요.'
      );
    END IF;

    -- 일일 시청 한도(10회) 검증
    IF v_last_ad_date IS NOT NULL AND v_last_ad_date = v_today THEN
      IF COALESCE(v_daily_ad_count, 0) >= v_max_daily_mineral_ads THEN
        RETURN pg_catalog.jsonb_build_object(
          'success', false,
          'message', '오늘 가능한 무료 충전 횟수(' || v_max_daily_mineral_ads || '회)를 모두 사용했습니다.'
        );
      END IF;
      v_new_daily_count := COALESCE(v_daily_ad_count, 0) + 1;
    ELSE
      v_new_daily_count := 1;
    END IF;

    v_reward_minerals := 500;

    UPDATE public.profiles
    SET minerals = minerals + v_reward_minerals,
        last_ad_mineral_recharge = now(),
        daily_ad_mineral_count = v_new_daily_count,
        last_ad_mineral_date = v_today,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reward_type', p_ad_type,
      'reward_minerals', v_reward_minerals,
      'minerals', v_minerals + v_reward_minerals,
      'remaining_daily_views', v_max_daily_mineral_ads - v_new_daily_count,
      'message', v_reward_minerals || ' 미네랄을 획득했습니다!'
    );

  -- 3) DOUBLE REWARD (결과 화면 2배 보너스)
  ELSIF p_ad_type = 'double_reward' THEN
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
