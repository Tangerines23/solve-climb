-- ============================================================================
-- 트리거: SECURITY DEFINER RPC에서 profiles 업데이트 허용
-- 작성일: 2026.01.31
-- 목적: check_profile_update_security 트리거가 RPC(consume_stamina 등)의
--       정당한 업데이트를 막는 문제 수정. 세션 변수로 RPC 호출 시 bypass.
-- ============================================================================

-- 1. 트리거 함수 수정: app.bypass_profile_security = '1' 이면 검사 생략
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- SECURITY DEFINER RPC에서 set_config('app.bypass_profile_security','1',true) 한 경우 허용
  IF current_setting('app.bypass_profile_security', true) = '1' THEN
    RETURN NEW;
  END IF;
  -- 클라이언트(authenticated/anon) 권한으로 직접 업데이트가 시도된 경우만 체크
  IF (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
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

-- 2. consume_stamina: UPDATE 전 bypass 설정
CREATE OR REPLACE FUNCTION public.consume_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
BEGIN
    PERFORM set_config('app.bypass_profile_security', '1', true);
    v_user_id := auth.uid();

    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_stamina > 0 THEN
        UPDATE public.profiles
        SET stamina = stamina - 1,
            last_stamina_update = CASE
                WHEN stamina = 5 THEN NOW()
                ELSE last_stamina_update
            END
        WHERE id = v_user_id;
        RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina - 1);
    ELSE
        RETURN jsonb_build_object('success', true, 'stamina', 0, 'is_exhausted', true);
    END IF;
END;
$$;

-- 3. check_and_recover_stamina: UPDATE 전 bypass 설정
CREATE OR REPLACE FUNCTION public.check_and_recover_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
    v_max_stamina CONSTANT INTEGER := 5;
    v_last_update TIMESTAMPTZ;
    v_minutes_passed INTEGER;
    v_recovered_amount INTEGER;
    v_new_stamina INTEGER;
BEGIN
    PERFORM set_config('app.bypass_profile_security', '1', true);
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    SELECT stamina, last_stamina_update
    INTO v_current_stamina, v_last_update
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
    END IF;

    IF v_current_stamina < v_max_stamina THEN
        v_minutes_passed := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_last_update)) / 60);
        v_recovered_amount := FLOOR(v_minutes_passed / 10);

        IF v_recovered_amount > 0 THEN
            v_new_stamina := LEAST(v_current_stamina + v_recovered_amount, v_max_stamina);

            IF v_new_stamina = v_max_stamina THEN
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = NOW()
                WHERE id = v_user_id;
            ELSE
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = v_last_update + (v_recovered_amount * INTERVAL '10 minutes')
                WHERE id = v_user_id;
            END IF;

            v_current_stamina := v_new_stamina;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

-- 4. recover_stamina_ads: UPDATE 전 bypass 설정
CREATE OR REPLACE FUNCTION public.recover_stamina_ads()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
BEGIN
    PERFORM set_config('app.bypass_profile_security', '1', true);
    v_user_id := auth.uid();

    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_stamina < 5 THEN
        UPDATE public.profiles
        SET stamina = stamina + 1
        WHERE id = v_user_id;

        RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina + 1);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Stamina is already full', 'stamina', v_current_stamina);
    END IF;
END;
$$;

-- 5. handle_daily_login: minerals 업데이트 시 트리거 bypass
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_last_login_at TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
  v_reward_minerals INTEGER;
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_last_login_date DATE;
BEGIN
  SELECT last_login_at, login_streak
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;

    IF v_last_login_date = v_today THEN
      RETURN json_build_object(
        'success', false,
        'message', '이미 오늘 보상을 받았습니다.',
        'streak', v_current_streak
      );
    END IF;

    IF v_last_login_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      v_current_streak := 1;
    END IF;
  ELSE
    v_current_streak := 1;
  END IF;

  v_reward_minerals := LEAST(500, v_current_streak * 50);

  PERFORM set_config('app.bypass_profile_security', '1', true);
  UPDATE public.profiles
  SET
    last_login_at = now(),
    login_streak = v_current_streak,
    minerals = minerals + v_reward_minerals
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'reward_minerals', v_reward_minerals,
    'streak', v_current_streak,
    'message', '출석 보상이 지급되었습니다!'
  );
END;
$$;

COMMENT ON FUNCTION public.check_profile_update_security() IS 'RPC 업데이트 허용(bypass) 시 검사 생략, 그 외 클라이언트 직접 수정 방지';
