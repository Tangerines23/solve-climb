-- [RESTORE] Missing Core RPC Functions
-- Date: 2026-04-25
-- Purpose: Restore functions dropped in 20260407 but not re-created properly.

-- 1. check_and_recover_stamina
CREATE OR REPLACE FUNCTION public.check_and_recover_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_stamina INTEGER;
    v_max_stamina CONSTANT INTEGER := 5;
    v_last_update TIMESTAMPTZ;
    v_minutes_passed INTEGER;
    v_recovered_amount INTEGER;
    v_new_stamina INTEGER;
BEGIN
    -- Authentication Check
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Bypass security for profile update
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    SELECT stamina, last_stamina_update
    INTO v_current_stamina, v_last_update
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Profile not found');
    END IF;

    -- Recovery logic (1 per 10 minutes)
    IF v_current_stamina < v_max_stamina THEN
        v_minutes_passed := FLOOR(EXTRACT(EPOCH FROM (now() - v_last_update)) / 60);
        v_recovered_amount := FLOOR(v_minutes_passed / 10);

        IF v_recovered_amount > 0 THEN
            v_new_stamina := LEAST(v_current_stamina + v_recovered_amount, v_max_stamina);

            IF v_new_stamina = v_max_stamina THEN
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = now(),
                    updated_at = now()
                WHERE id = v_user_id;
            ELSE
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = v_last_update + (v_recovered_amount * INTERVAL '10 minutes'),
                    updated_at = now()
                WHERE id = v_user_id;
            END IF;

            v_current_stamina := v_new_stamina;
        END IF;
    END IF;

    RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

-- 2. consume_stamina
CREATE OR REPLACE FUNCTION public.consume_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_stamina INTEGER;
BEGIN
    -- Authentication Check
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Bypass security for profile update
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_stamina > 0 THEN
        UPDATE public.profiles
        SET stamina = stamina - 1,
            last_stamina_update = CASE
                WHEN stamina = 5 THEN now()
                ELSE last_stamina_update
            END,
            updated_at = now()
        WHERE id = v_user_id;
        RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', v_current_stamina - 1);
    ELSE
        RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', 0, 'is_exhausted', true);
    END IF;
END;
$$;

-- 3. recover_stamina_ads
CREATE OR REPLACE FUNCTION public.recover_stamina_ads()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_stamina INTEGER;
BEGIN
    -- Authentication Check
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Bypass security for profile update
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_stamina < 5 THEN
        UPDATE public.profiles
        SET stamina = stamina + 1,
            updated_at = now()
        WHERE id = v_user_id;

        RETURN pg_catalog.jsonb_build_object('success', true, 'stamina', v_current_stamina + 1);
    ELSE
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Stamina is already full', 'stamina', v_current_stamina);
    END IF;
END;
$$;

-- 4. handle_daily_login
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_last_login_at TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
  v_reward_minerals INTEGER;
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_last_login_date DATE;
BEGIN
  -- Authentication Check
  IF v_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT last_login_at, login_streak
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;

    IF v_last_login_date = v_today THEN
      RETURN pg_catalog.jsonb_build_object(
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

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
  UPDATE public.profiles
  SET
    last_login_at = now(),
    login_streak = v_current_streak,
    minerals = minerals + v_reward_minerals,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reward_minerals', v_reward_minerals,
    'streak', v_current_streak,
    'message', '출석 보상이 지급되었습니다!'
  );
END;
$$;
