-- ============================================================================
-- ?�속 출석 보상 ?�스??(Daily Login Reward)
-- ============================================================================

-- 1. profiles ?�이블에 출석 관??컬럼 추�?
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;

-- 2. ?�일�?로그??처리 RPC ?�수
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_last_login_at TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
  v_reward_minerals INTEGER;
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_last_login_date DATE;
BEGIN
  -- ?��? ?�보 조회
  SELECT last_login_at, login_streak 
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  -- 마�?�?로그???�짜 ?�인
  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;
    
    -- ?��? ?�늘 로그?�했?�면 (KST 기�?)
    IF v_last_login_date = v_today THEN
      RETURN JSONB_build_object(
        'success', false,
        'message', '?��? ?�늘 보상??받았?�니??',
        'streak', v_current_streak
      );
    END IF;

    -- ?�제 로그?�했?��? ?�인 (?�속 출석 체크)
    IF v_last_login_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      -- ?�루 ?�상 거른 경우 ?�트�?초기??
      v_current_streak := 1;
    END IF;
  ELSE
    -- �?로그??
    v_current_streak := 1;
  END IF;

  -- 보상??계산 (기본 50, ?�루??+50, 최�? 500)
  v_reward_minerals := LEAST(500, v_current_streak * 50);

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
    'message', '출석 보상??지급되?�습?�다!'
  );
END;
$$;
