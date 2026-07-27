-- Fix theme_code NULL constraint violation in submit_game_result RPC function
-- Ensures v_theme_code and v_mode_code never evaluate to NULL during user_level_records insertion

CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers pg_catalog.jsonb,
  p_question_ids pg_catalog.jsonb,
  p_game_mode pg_catalog.text,
  p_items_used pg_catalog.jsonb,
  p_session_id pg_catalog.uuid,
  p_category pg_catalog.text DEFAULT 'math',
  p_subject pg_catalog.text DEFAULT 'add',
  p_level pg_catalog.int4 DEFAULT 1,
  p_avg_solve_time pg_catalog.float8 DEFAULT 0.0
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id pg_catalog.uuid := auth.uid();
  v_calculated_score pg_catalog.int4 := 0;
  v_correct_count pg_catalog.int4 := 0;
  v_total_questions pg_catalog.int4 := 0;
  v_wrong_answers pg_catalog.jsonb := '[]'::pg_catalog.jsonb;
  v_session_questions pg_catalog.jsonb;
  v_question pg_catalog.jsonb;
  v_question_id pg_catalog.uuid;
  v_user_answer pg_catalog.int4;
  v_correct_answer pg_catalog.int4;
  v_earned_minerals pg_catalog.int4 := 0;
  v_theme_id pg_catalog.text;
  v_theme_code pg_catalog.int2;
  v_mode_code pg_catalog.int2;
  v_old_best_score pg_catalog.int4;
  v_new_best_score pg_catalog.int4;
  v_score_diff pg_catalog.int4;
  v_tier_info pg_catalog.jsonb;
  v_mode_weight pg_catalog.numeric := 1.0;
  v_is_debug pg_catalog.bool := false;
  v_session_status pg_catalog.text;
  v_prev_result pg_catalog.jsonb;
  
  MINERALS_PER_SCORE CONSTANT pg_catalog.int4 := 100;
  MAX_MINERALS CONSTANT pg_catalog.int4 := 1000;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_debug FROM public.game_config WHERE key = 'debug_mode_enabled';

  SELECT status, result INTO v_session_status, v_prev_result
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF v_session_status IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session_status = 'completed' THEN
    RETURN COALESCE(v_prev_result, pg_catalog.jsonb_build_object('success', true, 'idempotent', true));
  END IF;

  SELECT questions INTO v_session_questions FROM public.game_sessions WHERE id = p_session_id;
  v_total_questions := pg_catalog.jsonb_array_length(p_question_ids);
  
  FOR i IN 0..(v_total_questions - 1) LOOP
    v_question_id := (p_question_ids->>i)::pg_catalog.uuid;
    v_user_answer := (p_user_answers->>i)::pg_catalog.int4;

    SELECT q INTO v_question 
    FROM pg_catalog.jsonb_array_elements(v_session_questions) AS q 
    WHERE (q->>'id')::pg_catalog.uuid = v_question_id;

    IF v_question IS NOT NULL THEN
      -- 지원 가능한 모든 정답 키 (answer, correct_answer, correctAnswer) 호환 검출
      v_correct_answer := COALESCE(
        (v_question->>'answer')::pg_catalog.int4,
        (v_question->>'correct_answer')::pg_catalog.int4,
        (v_question->>'correctAnswer')::pg_catalog.int4
      );

      IF v_user_answer IS NOT NULL AND v_user_answer = v_correct_answer THEN
        v_correct_count := v_correct_count + 1;
      ELSE
        v_wrong_answers := v_wrong_answers || pg_catalog.jsonb_build_object(
          'question_id', v_question_id,
          'user_answer', v_user_answer,
          'correct_answer', v_correct_answer,
          'content', COALESCE(v_question->>'content', v_question->>'question')
        );
      END IF;
    END IF;
  END LOOP;

  IF p_game_mode = 'survival' THEN v_mode_weight := 0.8; END IF;
  v_calculated_score := pg_catalog.floor((v_correct_count::pg_catalog.numeric / GREATEST(v_total_questions, 1)) * p_level * v_mode_weight * 100)::pg_catalog.int4;

  INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions, last_played_at, updated_at)
  VALUES (v_user_id, 1, v_correct_count, v_total_questions, pg_catalog.now(), pg_catalog.now())
  ON CONFLICT (id) DO UPDATE SET
    total_games = user_statistics.total_games + 1,
    total_correct = user_statistics.total_correct + EXCLUDED.total_correct,
    total_questions = user_statistics.total_questions + EXCLUDED.total_questions,
    avg_solve_time = CASE 
      WHEN user_statistics.total_games = 0 THEN p_avg_solve_time 
      ELSE (user_statistics.avg_solve_time * user_statistics.total_games + p_avg_solve_time) / (user_statistics.total_games + 1)
    END,
    last_played_at = pg_catalog.now(),
    updated_at = pg_catalog.now();

  INSERT INTO public.user_game_logs (
    user_id, game_mode, world_id, category_id, level, score, correct_count, total_questions, avg_solve_time, wrong_answers
  ) VALUES (
    v_user_id, p_game_mode, p_category, p_subject, p_level, v_calculated_score, v_correct_count, v_total_questions, p_avg_solve_time, v_wrong_answers
  );

  -- 다단계 theme_code 탐색 및 Fallback 보장
  v_theme_id := p_category || '_' || p_subject;
  SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;

  IF v_theme_code IS NULL THEN
    SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = p_category;
  END IF;

  IF v_theme_code IS NULL THEN
    SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = 'math_' || p_subject;
  END IF;

  IF v_theme_code IS NULL THEN
    SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = 'math_' || p_category;
  END IF;

  IF v_theme_code IS NULL THEN
    v_theme_code := 1; -- 기본 fallback (math_add)
  END IF;

  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;
  IF v_mode_code IS NULL THEN
    v_mode_code := 1; -- 기본 fallback (timeattack)
  END IF;

  v_earned_minerals := LEAST(floor(v_calculated_score::pg_catalog.numeric / MINERALS_PER_SCORE), MAX_MINERALS);
  
  PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);
  
  -- Update profiles with weekly and best scores for ranking reflection
  UPDATE public.profiles 
  SET minerals = minerals + v_earned_minerals,
      weekly_score_total = COALESCE(weekly_score_total, 0::pg_catalog.int8) + v_calculated_score,
      weekly_score_timeattack = CASE WHEN p_game_mode = 'time-attack' OR p_game_mode = 'timeattack' THEN GREATEST(COALESCE(weekly_score_timeattack, 0::pg_catalog.int8), v_calculated_score::pg_catalog.int8) ELSE weekly_score_timeattack END,
      weekly_score_survival = CASE WHEN p_game_mode = 'survival' THEN GREATEST(COALESCE(weekly_score_survival, 0::pg_catalog.int8), v_calculated_score::pg_catalog.int8) ELSE weekly_score_survival END,
      best_score_timeattack = CASE WHEN p_game_mode = 'time-attack' OR p_game_mode = 'timeattack' THEN GREATEST(COALESCE(best_score_timeattack, 0::pg_catalog.int8), v_calculated_score::pg_catalog.int8) ELSE best_score_timeattack END,
      best_score_survival = CASE WHEN p_game_mode = 'survival' THEN GREATEST(COALESCE(best_score_survival, 0::pg_catalog.int8), v_calculated_score::pg_catalog.int8) ELSE best_score_survival END,
      last_game_submit_at = pg_catalog.now()
  WHERE id = v_user_id;

  SELECT best_score INTO v_old_best_score 
  FROM public.user_level_records 
  WHERE user_id = v_user_id AND theme_code = v_theme_code AND level = p_level AND mode_code = v_mode_code;

  v_new_best_score := GREATEST(COALESCE(v_old_best_score, 0::pg_catalog.int4), v_calculated_score);
  
  IF v_new_best_score > COALESCE(v_old_best_score, 0::pg_catalog.int4) THEN
    v_score_diff := v_new_best_score - COALESCE(v_old_best_score, 0::pg_catalog.int4);
    
    INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score, updated_at)
    VALUES (v_user_id, v_theme_code, p_level, v_mode_code, v_new_best_score, pg_catalog.now())
    ON CONFLICT (user_id, theme_code, level, mode_code) 
    DO UPDATE SET best_score = v_new_best_score, updated_at = pg_catalog.now();

    UPDATE public.profiles SET total_mastery_score = total_mastery_score + v_score_diff WHERE id = v_user_id;
  END IF;

  v_tier_info := public.update_user_tier(v_user_id);

  UPDATE public.game_sessions SET status = 'completed', result = pg_catalog.jsonb_build_object(
    'success', true,
    'calculated_score', v_calculated_score,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'earned_minerals', v_earned_minerals,
    'new_record', v_new_best_score > COALESCE(v_old_best_score, 0::pg_catalog.int4)
  ) WHERE id = p_session_id;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '', true);

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'calculated_score', v_calculated_score,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'earned_minerals', v_earned_minerals,
    'new_record', v_new_best_score > COALESCE(v_old_best_score, 0::pg_catalog.int4)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_game_result(pg_catalog.jsonb, pg_catalog.jsonb, pg_catalog.text, pg_catalog.jsonb, pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.int4, pg_catalog.float8) TO anon, authenticated;
