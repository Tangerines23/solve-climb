-- Migration: Fix Daily Login & Ad Reward & Stamina RPC with p_user_id fallback & Full Stamina Recovery & Conflict-Free Upsert
-- Date: 2026-07-27

-- 1. Fix handle_daily_login with p_user_id fallback & ON CONFLICT safe Profile Creation
DROP FUNCTION IF EXISTS public.handle_daily_login() CASCADE;
DROP FUNCTION IF EXISTS public.handle_daily_login(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.handle_daily_login(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := COALESCE(auth.uid(), p_user_id);
  v_last_login_at TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER := 1;
  v_reward_minerals INTEGER := 100;
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_last_login_date DATE;
  v_profile_exists BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN 
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated'); 
  END IF;

  -- Security bypass for profile creation/update inside RPC
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT last_login_at, login_streak INTO v_last_login_at, v_current_streak 
  FROM public.profiles 
  WHERE id = v_user_id 
  FOR UPDATE;

  v_profile_exists := FOUND;

  -- 프로필이 아직 생성되지 않은 경우 자동 생성 및 첫 출석 보상 지급 (ON CONFLICT 구문 적용으로 409 Conflict 방지)
  IF NOT v_profile_exists THEN
    INSERT INTO public.profiles (
      id, nickname, stamina, minerals, last_stamina_update, last_login_at, login_streak, updated_at
    ) VALUES (
      v_user_id, '게이머', 5, 100, now(), now(), 1, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      last_login_at = EXCLUDED.last_login_at,
      updated_at = EXCLUDED.updated_at;

    RETURN pg_catalog.jsonb_build_object(
      'success', true, 
      'reward_minerals', 100, 
      'streak', 1, 
      'message', '첫 출석 보상(100 미네랄)이 지급되었습니다!'
    );
  END IF;

  -- 프로필이 존재하는 경우 오늘 이미 받았는지 검사
  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;
    IF v_last_login_date = v_today THEN 
      RETURN pg_catalog.jsonb_build_object(
        'success', false, 
        'message', '이미 오늘 출석 보상을 받았습니다.', 
        'streak', v_current_streak
      ); 
    END IF;

    -- 연대 출석 일수 계산
    IF v_last_login_date = v_today - INTERVAL '1 day' THEN
      v_current_streak := LEAST(v_current_streak + 1, 7);
    ELSE
      v_current_streak := 1;
    END IF;
  ELSE
    v_current_streak := 1;
  END IF;

  -- 7일차 보너스 적용
  IF v_current_streak = 7 THEN
    v_reward_minerals := 300;
  END IF;

  -- 프로필 보상 반영 및 로그인 일시 갱신
  UPDATE public.profiles 
  SET minerals = minerals + v_reward_minerals,
      login_streak = v_current_streak,
      last_login_at = now(),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true, 
    'reward_minerals', v_reward_minerals, 
    'streak', v_current_streak, 
    'message', v_current_streak || '일 연속 출석! ' || v_reward_minerals || ' 미네랄이 지급되었습니다.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.handle_daily_login(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_daily_login(UUID) TO authenticated, anon;


-- 2. Fix secure_reward_ad_view with p_user_id fallback & Full Stamina Recovery & Conflict-Free Upsert
DROP FUNCTION IF EXISTS public.secure_reward_ad_view() CASCADE;
DROP FUNCTION IF EXISTS public.secure_reward_ad_view(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.secure_reward_ad_view(TEXT, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(
  p_ad_type TEXT,
  p_user_id UUID DEFAULT NULL
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
  v_reward_minerals INTEGER := 100;
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
    -- 스태미나 광고 시청시 풀피(5) 완충!
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

  ELSIF p_ad_type = 'mineral_recharge' OR p_ad_type = 'double_reward' THEN
    IF p_ad_type = 'double_reward' THEN
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

REVOKE ALL ON FUNCTION public.secure_reward_ad_view(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secure_reward_ad_view(TEXT, UUID) TO authenticated, anon;


-- 3. Fix check_and_recover_stamina with p_user_id fallback & ON CONFLICT safe Profile Creation
DROP FUNCTION IF EXISTS public.check_and_recover_stamina() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_recover_stamina(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.check_and_recover_stamina(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), p_user_id);
    v_current_stamina INTEGER;
    v_max_stamina CONSTANT INTEGER := 5;
    v_last_update TIMESTAMPTZ;
    v_minutes_passed INTEGER;
    v_recovered_amount INTEGER;
    v_new_stamina INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    SELECT stamina, last_stamina_update
    INTO v_current_stamina, v_last_update
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- 프로필 없을 시 자동 생성 (ON CONFLICT 409 방지)
        INSERT INTO public.profiles (id, nickname, stamina, minerals, last_stamina_update, updated_at)
        VALUES (v_user_id, '게이머', 5, 0, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at;

        RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', 5);
    END IF;

    IF v_last_update IS NULL THEN
        v_last_update := now();
        UPDATE public.profiles SET last_stamina_update = v_last_update WHERE id = v_user_id;
    END IF;

    IF v_current_stamina < v_max_stamina THEN
        v_minutes_passed := FLOOR(EXTRACT(EPOCH FROM (now() - v_last_update)) / 60);
        v_recovered_amount := FLOOR(v_minutes_passed / 10);

        IF v_recovered_amount > 0 THEN
            v_new_stamina := LEAST(v_current_stamina + v_recovered_amount, v_max_stamina);
            IF v_new_stamina = v_max_stamina THEN
                UPDATE public.profiles SET stamina = v_new_stamina, last_stamina_update = now(), updated_at = now() WHERE id = v_user_id;
            ELSE
                UPDATE public.profiles SET stamina = v_new_stamina, last_stamina_update = v_last_update + (v_recovered_amount * INTERVAL '10 minutes'), updated_at = now() WHERE id = v_user_id;
            END IF;
            v_current_stamina := v_new_stamina;
        END IF;
    END IF;

    RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_recover_stamina(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_recover_stamina(UUID) TO authenticated, anon;


-- 4. Overload wrappers for PostgREST Schema Cache compatibility
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.handle_daily_login(p_user_id => NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(p_ad_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.secure_reward_ad_view(p_ad_type => p_ad_type, p_user_id => NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_recover_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.check_and_recover_stamina(p_user_id => NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_daily_login() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.secure_reward_ad_view(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_and_recover_stamina() TO authenticated, anon;
