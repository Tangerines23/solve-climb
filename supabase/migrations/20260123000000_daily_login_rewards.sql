-- ============================================================================
-- 연속 출석 보상 시스템 (Daily Login Reward)
-- ============================================================================

-- 1. profiles 테이블에 출석 관련 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;

-- 2. 데일리 로그인 처리 RPC 함수
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
  -- 유저 정보 조회
  SELECT last_login_at, login_streak 
  INTO v_last_login_at, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id;

  -- 마지막 로그인 날짜 확인
  IF v_last_login_at IS NOT NULL THEN
    v_last_login_date := (v_last_login_at AT TIME ZONE 'Asia/Seoul')::DATE;
    
    -- 이미 오늘 로그인했다면 (KST 기준)
    IF v_last_login_date = v_today THEN
      RETURN json_build_object(
        'success', false,
        'message', '이미 오늘 보상을 받았습니다.',
        'streak', v_current_streak
      );
    END IF;

    -- 어제 로그인했는지 확인 (연속 출석 체크)
    IF v_last_login_date = (v_today - INTERVAL '1 day')::DATE THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      -- 하루 이상 거른 경우 스트릭 초기화
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
    'message', '출석 보상이 지급되었습니다!'
  );
END;
$$;
