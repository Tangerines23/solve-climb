-- ============================================================================
-- ?�점 �?DevTools ?�상?��? ?�한 RPC 복구
-- ?�성?? 2026.01.26
-- ============================================================================

-- [중복 ?�거] add_minerals?� handle_daily_login?� 20251222000000_create_profiles.sql?�서 ?�의??
-- ?�기?�는 ?�요 ??추�??�인 fix??comment�??�깁?�다.

-- handle_daily_login 최신??(보안 ?�리�?bypass 로직 ?�함)
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
  IF v_user_id IS NULL THEN
     RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- ?��? ?�보 조회
  SELECT last_login_at, login_streak 
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  -- 마�?�?로그???�짜 ?�인
  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;
    
    -- ?��? ?�늘 로그?�했?�면
    IF v_last_login_date = v_today THEN
      RETURN JSONB_build_object(
        'success', false,
        'message', 'Already claimed today',
        'streak', v_current_streak
      );
    END IF;

    -- ?�제 로그?�했?��? ?�인 (?�속 출석 체크)
    IF v_last_login_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      v_current_streak := 1;
    END IF;
  ELSE
    -- �?로그??
    v_current_streak := 1;
  END IF;

  -- 보상??계산 (기본 50, ?�루??+50, 최�? 500)
  v_reward_minerals := LEAST(500, v_current_streak * 50);

  -- [중요] 보안 ?�리�??�회 ?�정
  PERFORM set_config('app.bypass_profile_security', '1', true);
  
  -- ?�로???�데?�트
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
    'message', 'Daily reward claimed'
  );
END;
$$;
