-- ============================================================================
-- create_game_session 함수에 디버그 세션 파라미터 추가
-- 작성일: 2025.01.01
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_game_session(
  p_questions JSONB,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_game_mode TEXT DEFAULT 'timeattack',
  p_is_debug_session BOOLEAN DEFAULT false  -- ⚠️ 추가
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_questions_for_client JSONB;
BEGIN
  -- 인증 검증
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 기존 활성 세션이 있으면 만료 처리
  UPDATE public.game_sessions
  SET status = 'expired'
  WHERE user_id = v_user_id AND status = 'playing';
  
  -- 새 세션 생성 (is_debug_session 포함)
  INSERT INTO public.game_sessions (
    user_id, status, expires_at, questions, 
    category, subject, level, game_mode,
    is_debug_session  -- ⚠️ 추가
  )
  VALUES (
    v_user_id, 'playing', NOW() + INTERVAL '30 minutes', 
    p_questions, p_category, p_subject, p_level, p_game_mode,
    p_is_debug_session  -- ⚠️ 추가
  )
  RETURNING id INTO v_session_id;
  
  -- 클라이언트용 questions 생성 (correct_answer 필드 제거)
  SELECT jsonb_agg(q - 'correct_answer') INTO v_questions_for_client
  FROM jsonb_array_elements(p_questions) AS q;
  
  RETURN json_build_object(
    'session_id', v_session_id,
    'expires_at', (SELECT expires_at FROM public.game_sessions WHERE id = v_session_id),
    'questions', v_questions_for_client
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

