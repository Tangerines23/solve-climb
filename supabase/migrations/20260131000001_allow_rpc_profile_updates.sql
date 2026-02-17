-- ============================================================================
-- ?�리�? SECURITY DEFINER RPC?�서 profiles ?�데?�트 ?�용
-- ?�성?? 2026.01.31
-- 목적: check_profile_update_security ?�리거�? RPC(consume_stamina ????
--       ?�당???�데?�트�?막는 문제 ?�정. ?�션 변?�로 RPC ?�출 ??bypass.
-- ============================================================================

-- 1. ?�리�??�수 ?�정: app.bypass_profile_security = '1' ?�면 검???�략
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- SECURITY DEFINER RPC?�서 set_config('app.bypass_profile_security','1',true) ??경우 ?�용
  IF current_setting('app.bypass_profile_security', true) = '1' THEN
    RETURN NEW;
  END IF;
  -- ?�라?�언??authenticated/anon) 권한?�로 직접 ?�데?�트가 ?�도??경우�?체크
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

-- 2. consume_stamina: UPDATE ??bypass ?�정
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
        RETURN JSONB_build_object('success', true, 'stamina', v_current_stamina - 1);
    ELSE
        RETURN JSONB_build_object('success', true, 'stamina', 0, 'is_exhausted', true);
    END IF;
END;
$$;

-- 3. check_and_recover_stamina: UPDATE ??bypass ?�정
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
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    SELECT stamina, last_stamina_update
    INTO v_current_stamina, v_last_update
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN JSONB_build_object('success', false, 'message', 'Profile not found');
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

    RETURN JSONB_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

-- 4. recover_stamina_ads: UPDATE ??bypass ?�정
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

        RETURN JSONB_build_object('success', true, 'stamina', v_current_stamina + 1);
    ELSE
        RETURN JSONB_build_object('success', false, 'message', 'Stamina is already full', 'stamina', v_current_stamina);
    END IF;
END;
$$;

-- 5. handle_daily_login: minerals ?�데?�트 ???�리�?bypass
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSONB
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
      RETURN JSONB_build_object(
        'success', false,
        'message', '?��? ?�늘 보상??받았?�니??',
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

  RETURN JSONB_build_object(
    'success', true,
    'reward_minerals', v_reward_minerals,
    'streak', v_current_streak,
    'message', '출석 보상??지급되?�습?�다!'
  );
END;
$$;

COMMENT ON FUNCTION public.check_profile_update_security() IS 'RPC ?�데?�트 ?�용(bypass) ??검???�략, �????�라?�언??직접 ?�정 방�?';
