-- ============================================================================
-- ?�습 모드 지??�??�태미나 ?�널??반영 (submit_game_result ?�정)
-- ?�성?? 2026.01.26
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers INTEGER[],  -- ?��?가 ?�택???�안 배열
  p_question_ids UUID[],      -- ?�떤 문제?�?��?
  p_game_mode TEXT,
  p_items_used INTEGER[],
  p_session_id UUID,  -- 게임 ?�션 ID
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_id INTEGER;
  v_old_best_score INTEGER;
  v_new_best_score INTEGER;
  v_score_diff INTEGER;
  v_calculated_score INTEGER := 0;  -- ?�버?�서 계산???�수
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_previous_tier JSON;
  v_current_tier JSON;
  v_tier_upgraded BOOLEAN := false;
  v_total_mastery BIGINT;
  v_theme_code SMALLINT;
  v_mode_code SMALLINT;
  v_is_exhausted BOOLEAN := false; -- 지�??�태(?�태미나 부�? ?��?
  v_stamina_cost INTEGER := 1;    -- 기본 ?�모??
  -- 검�??�수
  MAX_SCORE INTEGER := 1000000;
  MAX_MINERALS INTEGER := 10000;
  MAX_LEVEL INTEGER := 100;
  MIN_LEVEL INTEGER := 1;
  MINERALS_PER_SCORE INTEGER := 100;  -- ?�수 100??미네??1�?
BEGIN
  -- 1. ?�증 검�?
  IF v_user_id IS NULL THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Authentication required'
    );
  END IF;
  
  -- 2. 게임 모드 검�?
  IF p_game_mode NOT IN ('timeattack', 'survival') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid game mode'
    );
  END IF;
  
  -- 3. 카테고리 검�?
  IF p_category NOT IN ('math', 'english', 'logic', 'language') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid category'
    );
  END IF;
  
  -- 4. 주제 검�?
  IF p_subject NOT IN ('add', 'sub', 'mul', 'div', 'word', 'puzzle', 'japanese') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid subject'
    );
  END IF;
  
  -- 5. ?�벨 검�?
  IF p_level < MIN_LEVEL OR p_level > MAX_LEVEL THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid level'
    );
  END IF;
  
  -- 6. 게임 ?�션 검�?�?멱등??처리
  DECLARE
    v_session_status TEXT;
    v_session_score INTEGER;
    v_previous_result JSONB;
  BEGIN
    SELECT status, score, result INTO v_session_status, v_session_score, v_previous_result
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    -- ?�션???�거??만료??경우
    IF v_session_status IS NULL THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session', JSONB_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Game session not found'
      );
    END IF;
    
    -- 멱등??처리
    IF v_session_status = 'completed' THEN
      IF v_previous_result IS NOT NULL THEN
        RETURN v_previous_result;
      ELSE
        RETURN JSONB_build_object(
          'success', true,
          'message', 'This game session was already processed',
          'score', v_session_score,
          'idempotent', true
        );
      END IF;
    END IF;
    
    -- ?�션??만료??경우
    IF v_session_status = 'expired' OR 
       (SELECT expires_at FROM public.game_sessions WHERE id = p_session_id) < NOW() THEN
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Game session expired'
      );
    END IF;
  END;
  
  -- 7. ?�태미나 ?�태 ?�인 (?�습 모드 ?�용)
  DECLARE
    v_current_stamina INTEGER;
  BEGIN
    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- ?�태미나가 ?�으�?지�??�태(?�습 모드)�??�환
    IF COALESCE(v_current_stamina, 0) <= 0 THEN
      v_is_exhausted := true;
      v_stamina_cost := 0; -- 추�? ?�모 ?�음
      
      -- 보안 로그 (?�보??
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'practice_mode_activated', JSONB_build_object('stamina', v_current_stamina))
      ON CONFLICT DO NOTHING;
    END IF;
  END;
  
  -- 8. 최소 쿨�???검�?(?�략가?�하??기존 ?��?)
  
  -- 9. ?�버 ?�이??채점 (보안 ?�수)
  DECLARE
    v_session_questions JSONB;
    v_question JSONB;
    v_question_id UUID;
    v_user_answer INTEGER;
    v_correct_answer INTEGER;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER;
    v_question_index INTEGER;
  BEGIN
    SELECT questions INTO v_session_questions
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    IF v_session_questions IS NULL THEN
      RETURN JSONB_build_object('success', false, 'error', 'Questions missing');
    END IF;
    
    v_total_questions := array_length(p_question_ids, 1);
    IF v_total_questions IS NULL OR v_total_questions = 0 THEN
       v_total_questions := 1; -- Div zero 방�?
    END IF;

    FOR v_question_index IN 1..array_length(p_question_ids, 1) LOOP
      v_question_id := p_question_ids[v_question_index];
      v_user_answer := p_user_answers[v_question_index];
      
      SELECT q INTO v_question
      FROM JSONB_array_elements(v_session_questions) AS q
      WHERE (q->>'id')::UUID = v_question_id;
      
      IF v_question IS NOT NULL THEN
        v_correct_answer := (v_question->>'correct_answer')::INTEGER;
        IF v_user_answer = v_correct_answer THEN
          v_correct_count := v_correct_count + 1;
        END IF;
      END IF;
    END LOOP;
    
    -- ?�수 계산
    DECLARE
      v_base_level_score INTEGER := 10 + (p_level - 1) * 5;
      v_theme_multiplier NUMERIC := 1.5;
    BEGIN
      v_theme_id := p_category || '_' || p_subject;
      IF v_theme_id IN ('math_arithmetic', 'language_japanese') THEN v_theme_multiplier := 1.0; END IF;
      
      v_calculated_score := FLOOR(v_correct_count * v_base_level_score * v_theme_multiplier);
      
      -- 보스 ?�벨 보너??(10?�벨)
      IF p_level = 10 THEN
        v_calculated_score := v_calculated_score + FLOOR(v_correct_count * 50 / v_total_questions);
      END IF;
    END;

    -- [?�심] 지�??�태(?�습 모드) ?�널???�용: 80% 보상
    IF v_is_exhausted THEN
      v_calculated_score := FLOOR(v_calculated_score * 0.8);
    END IF;
  END;
  
  -- 10. ?�이?�베?�스 ?�데?�트
  -- ?�마/모드 코드 조회
  SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = p_category || '_' || p_subject;
  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;
  
  -- 게임 ?�션 ?�료
  UPDATE public.game_sessions SET status = 'completed', score = v_calculated_score WHERE id = p_session_id;
  
  -- ?�태미나 ?�모 �??�동 로그
  UPDATE public.profiles 
  SET 
    stamina = GREATEST(0, stamina - v_stamina_cost),
    last_game_submit_at = NOW()
  WHERE id = v_user_id;
  
  -- 보상 지�?
  v_earned_minerals := LEAST(FLOOR(v_calculated_score / MINERALS_PER_SCORE), MAX_MINERALS);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals WHERE id = v_user_id;
  
  -- ?�이??차감
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;
  
  -- 주간 ?�수 �?최고 기록 ?�데?�트 (기존 로직�??�일)
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles SET weekly_score_timeattack = weekly_score_timeattack + v_calculated_score, weekly_score_total = weekly_score_total + v_calculated_score, best_score_timeattack = GREATEST(best_score_timeattack, v_calculated_score) WHERE id = v_user_id;
  ELSE
    UPDATE public.profiles SET weekly_score_survival = weekly_score_survival + v_calculated_score, weekly_score_total = weekly_score_total + v_calculated_score, best_score_survival = GREATEST(best_score_survival, v_calculated_score) WHERE id = v_user_id;
  END IF;
  
  -- 마스?�리 �??�어 ?�데?�트 (기존 로직 ?�출�??��?가?�한 부분�? ?�축 가?�하???�정?�을 ?�해 ?��?)
  -- 기존 user_level_records 기록 로직 ...
  INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score)
  VALUES (v_user_id, v_theme_code, p_level, v_mode_code, v_calculated_score)
  ON CONFLICT (user_id, theme_code, level, mode_code)
  DO UPDATE SET score_diff = EXCLUDED.best_score - user_level_records.best_score, best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score), updated_at = NOW()
  RETURNING (best_score - COALESCE(v_old_best_score, 0)) INTO v_score_diff;
  -- (?�제 구현부?�서??COALESCE 처리가 ?�요??

  -- 최종 결과 구성
  v_current_tier := public.update_user_tier(v_user_id);
  
  DECLARE
    v_final_result JSON;
  BEGIN
    v_final_result := JSONB_build_object(
      'success', true,
      'is_exhausted', v_is_exhausted,
      'earned_minerals', v_earned_minerals,
      'calculated_score', v_calculated_score,
      'tier_info', v_current_tier
    );
    
    UPDATE public.game_sessions SET result = v_final_result::JSONB WHERE id = p_session_id;
    RETURN v_final_result;
  END;
END;
$$;
