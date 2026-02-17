-- ============================================================================
-- create_game_session ?�수???�버�??�션 ?�라미터 추�?
-- ?�성?? 2025.01.01
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_game_session(
  p_questions JSONB,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_game_mode TEXT DEFAULT 'timeattack',
  p_is_debug_session BOOLEAN DEFAULT false  -- ?�️ 추�?
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_questions_for_client JSONB;
BEGIN
  -- ?�증 검�?
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 기존 ?�성 ?�션???�으�?만료 처리
  UPDATE public.game_sessions
  SET status = 'expired'
  WHERE user_id = v_user_id AND status = 'playing';
  
  -- ???�션 ?�성 (is_debug_session ?�함)
  INSERT INTO public.game_sessions (
    user_id, status, expires_at, questions, 
    category, subject, level, game_mode,
    is_debug_session  -- ?�️ 추�?
  )
  VALUES (
    v_user_id, 'playing', NOW() + INTERVAL '30 minutes', 
    p_questions, p_category, p_subject, p_level, p_game_mode,
    p_is_debug_session  -- ?�️ 추�?
  )
  RETURNING id INTO v_session_id;
  
  -- ?�라?�언?�용 questions ?�성 (correct_answer ?�드 ?�거)
  SELECT JSONB_agg(q - 'correct_answer') INTO v_questions_for_client
  FROM JSONB_array_elements(p_questions) AS q;
  
  RETURN JSONB_build_object(
    'session_id', v_session_id,
    'expires_at', (SELECT expires_at FROM public.game_sessions WHERE id = v_session_id),
    'questions', v_questions_for_client
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

