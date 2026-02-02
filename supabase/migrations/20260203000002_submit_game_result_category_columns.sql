-- ============================================================================
-- submit_game_result: theme_code -> category_id/subject_id/world_id 기반으로 변경
-- 작성일: 2026.02.03
-- 목적: 원격 DB의 user_level_records가 theme_code 대신 category_id/subject_id/world_id를
--       사용하므로 submit_game_result의 user_level_records 참조를 수정
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers INTEGER[],
  p_question_ids UUID[],
  p_game_mode TEXT,
  p_items_used INTEGER[],
  p_session_id UUID,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1
)
RETURNS JSON
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
  v_calculated_score INTEGER := 0;
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_previous_tier JSON;
  v_current_tier JSON;
  v_tier_upgraded BOOLEAN := false;
  v_total_mastery BIGINT;
  v_mode_code SMALLINT;
  v_world_id TEXT;
  v_is_exhausted BOOLEAN := false;
  v_stamina_cost INTEGER := 1;
  MAX_SCORE INTEGER := 1000000;
  MAX_MINERALS INTEGER := 10000;
  MAX_LEVEL INTEGER := 100;
  MIN_LEVEL INTEGER := 1;
  MINERALS_PER_SCORE INTEGER := 100;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  IF p_game_mode NOT IN ('timeattack', 'survival') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid game mode');
  END IF;
  
  IF p_category NOT IN ('math', 'english', 'logic', 'language') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid category');
  END IF;
  
  IF p_subject NOT IN ('add', 'sub', 'mul', 'div', 'word', 'puzzle', 'japanese') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid subject');
  END IF;
  
  IF p_level < MIN_LEVEL OR p_level > MAX_LEVEL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid level');
  END IF;
  
  DECLARE
    v_session_status TEXT;
    v_session_score INTEGER;
    v_previous_result JSONB;
  BEGIN
    SELECT status, score, result INTO v_session_status, v_session_score, v_previous_result
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    IF v_session_status IS NULL THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session', json_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      RETURN json_build_object('success', false, 'error', 'Game session not found');
    END IF;
    
    IF v_session_status = 'completed' THEN
      IF v_previous_result IS NOT NULL THEN
        RETURN v_previous_result;
      ELSE
        RETURN json_build_object('success', true, 'message', 'This game session was already processed', 'score', v_session_score, 'idempotent', true);
      END IF;
    END IF;
    
    IF v_session_status = 'expired' OR
       (SELECT expires_at FROM public.game_sessions WHERE id = p_session_id) < NOW() THEN
      RETURN json_build_object('success', false, 'error', 'Game session expired');
    END IF;
  END;
  
  DECLARE
    v_current_stamina INTEGER;
  BEGIN
    SELECT stamina INTO v_current_stamina FROM public.profiles WHERE id = v_user_id;
    IF COALESCE(v_current_stamina, 0) <= 0 THEN
      v_is_exhausted := true;
      v_stamina_cost := 0;
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'practice_mode_activated', json_build_object('stamina', v_current_stamina))
      ON CONFLICT DO NOTHING;
    END IF;
  END;
  
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
    SELECT questions INTO v_session_questions FROM public.game_sessions WHERE id = p_session_id AND user_id = v_user_id;
    IF v_session_questions IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Questions missing');
    END IF;
    
    v_total_questions := array_length(p_question_ids, 1);
    IF v_total_questions IS NULL OR v_total_questions = 0 THEN
      v_total_questions := 1;
    END IF;

    FOR v_question_index IN 1..array_length(p_question_ids, 1) LOOP
      v_question_id := p_question_ids[v_question_index];
      v_user_answer := p_user_answers[v_question_index];
      SELECT q INTO v_question FROM jsonb_array_elements(v_session_questions) AS q WHERE (q->>'id')::UUID = v_question_id;
      IF v_question IS NOT NULL THEN
        v_correct_answer := (v_question->>'correct_answer')::INTEGER;
        IF v_user_answer = v_correct_answer THEN
          v_correct_count := v_correct_count + 1;
        END IF;
      END IF;
    END LOOP;
    
    DECLARE
      v_base_level_score INTEGER := 10 + (p_level - 1) * 5;
      v_theme_multiplier NUMERIC := 1.5;
    BEGIN
      v_theme_id := p_category || '_' || p_subject;
      IF v_theme_id IN ('math_arithmetic', 'language_japanese') THEN v_theme_multiplier := 1.0; END IF;
      v_calculated_score := FLOOR(v_correct_count * v_base_level_score * v_theme_multiplier);
      IF p_level = 10 THEN
        v_calculated_score := v_calculated_score + FLOOR(v_correct_count * 50 / v_total_questions);
      END IF;
    END;

    IF v_is_exhausted THEN
      v_calculated_score := FLOOR(v_calculated_score * 0.8);
    END IF;
  END;
  
  -- mode_mapping 조회 (theme_mapping은 user_level_records에 필요 없음)
  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;
  IF v_mode_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid game mode');
  END IF;
  
  v_world_id := p_category || '_' || p_subject;
  
  UPDATE public.game_sessions SET status = 'completed', score = v_calculated_score WHERE id = p_session_id;
  
  UPDATE public.profiles 
  SET stamina = GREATEST(0, stamina - v_stamina_cost), last_game_submit_at = NOW()
  WHERE id = v_user_id;
  
  v_earned_minerals := LEAST(FLOOR(v_calculated_score / MINERALS_PER_SCORE), MAX_MINERALS);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals WHERE id = v_user_id;
  
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;
  
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles SET weekly_score_timeattack = weekly_score_timeattack + v_calculated_score, weekly_score_total = weekly_score_total + v_calculated_score, best_score_timeattack = GREATEST(best_score_timeattack, v_calculated_score) WHERE id = v_user_id;
  ELSE
    UPDATE public.profiles SET weekly_score_survival = weekly_score_survival + v_calculated_score, weekly_score_total = weekly_score_total + v_calculated_score, best_score_survival = GREATEST(best_score_survival, v_calculated_score) WHERE id = v_user_id;
  END IF;
  
  -- user_level_records: category_id/subject_id/world_id 기반 (theme_code 대체)
  SELECT best_score INTO v_old_best_score
  FROM public.user_level_records
  WHERE user_id = v_user_id
    AND category_id = p_category
    AND subject_id = p_subject
    AND world_id = v_world_id
    AND level = p_level
    AND mode_code = v_mode_code;

  INSERT INTO public.user_level_records (
    user_id, category_id, subject_id, world_id, level, mode_code, best_score
  )
  VALUES (
    v_user_id, p_category, p_subject, v_world_id, p_level, v_mode_code, v_calculated_score
  )
  ON CONFLICT (user_id, category_id, subject_id, level, mode_code, world_id)
  DO UPDATE SET
    best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
    updated_at = NOW();

  v_score_diff := GREATEST(0, v_calculated_score - COALESCE(v_old_best_score, 0));
  IF v_score_diff > 0 THEN
    UPDATE public.profiles
    SET total_mastery_score = total_mastery_score + v_score_diff, updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  v_current_tier := public.update_user_tier(v_user_id);
  
  DECLARE
    v_final_result JSON;
  BEGIN
    v_final_result := json_build_object(
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
