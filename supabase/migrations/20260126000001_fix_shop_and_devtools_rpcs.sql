-- ============================================================================
-- 상점 및 DevTools 정상화를 위한 RPC 복구
-- 작성일: 2026.01.26
-- ============================================================================

-- 1. 미네랄 추가/차감 (DevTools 및 광고 보상용)
CREATE OR REPLACE FUNCTION public.add_minerals(
  p_amount INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_amount INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', '로그인이 필요합니다.');
  END IF;

  UPDATE public.profiles
  SET minerals = GREATEST(0, minerals + p_amount),
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING minerals INTO v_new_amount;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '프로필을 찾을 수 없습니다.');
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', '미네랄이 업데이트되었습니다.',
    'minerals', v_new_amount
  );
END;
$$;

-- 2. 일일 로그인 보상 (누락 복구)
CREATE OR REPLACE FUNCTION public.handle_daily_login()
RETURNS JSON
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
  IF v_user_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- 유저 정보 조회
  SELECT last_login_at, login_streak 
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  -- 마지막 로그인 날짜 확인
  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;
    
    -- 이미 오늘 로그인했다면
    IF v_last_login_date = v_today THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Already claimed today',
        'streak', v_current_streak
      );
    END IF;

    -- 어제 로그인했는지 확인 (연속 출석 체크)
    IF v_last_login_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      v_current_streak := 1;
    END IF;
  ELSE
    -- 첫 로그인
    v_current_streak := 1;
  END IF;

  -- 보상액 계산 (기본 50, 하루당 +50, 최대 500)
  v_reward_minerals := LEAST(500, v_current_streak * 50);

  -- 프로필 업데이트
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
    'message', 'Daily reward claimed'
  );
END;
$$;
