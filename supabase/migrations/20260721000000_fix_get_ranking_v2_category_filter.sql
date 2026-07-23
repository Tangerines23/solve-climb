-- Fix get_ranking_v2 function: Remove invalid NULL self-comparison in WHERE clause and grant EXECUTE permissions to anon & authenticated roles

CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category pg_catalog.text,
    p_period pg_catalog.text,
    p_type pg_catalog.text,
    p_limit pg_catalog.int4 DEFAULT 50
)
RETURNS TABLE (
    out_user_id pg_catalog.uuid,
    out_nickname pg_catalog.text,
    out_score pg_catalog.int8,
    out_rank pg_catalog.int8
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as out_user_id,
            COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::pg_catalog.int8
                WHEN p_type = 'survival' THEN p.weekly_score_survival::pg_catalog.int8
                ELSE p.weekly_score_total::pg_catalog.int8
            END as out_score,
            pg_catalog.rank() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            )::pg_catalog.int8 as out_rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0::pg_catalog.int8
        ORDER BY 3 DESC
        LIMIT p_limit;
    ELSE
        -- All-Time (Total Mastery)
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, pg_catalog.sum(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                WHERE (p_category IS NULL OR p_category = 'all'::pg_catalog.text OR ulr.category_id = p_category)
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id as out_user_id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
                um.total_mastery::pg_catalog.int8 as out_score,
                pg_catalog.rank() OVER (ORDER BY um.total_mastery DESC)::pg_catalog.int8 as out_rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY 3 DESC
            LIMIT p_limit;
        ELSE
            -- Best Score per mode
            RETURN QUERY
            SELECT 
                p.id as out_user_id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::pg_catalog.int8
                    ELSE p.best_score_survival::pg_catalog.int8
                END as out_score,
                pg_catalog.rank() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                )::pg_catalog.int8 as out_rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY 3 DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) TO anon, authenticated;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'test_db_all_validations') THEN
    GRANT EXECUTE ON FUNCTION public.test_db_all_validations() TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_mastery_consistency') THEN
    GRANT EXECUTE ON FUNCTION public.check_mastery_consistency() TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'test_db_rpc_validation') THEN
    GRANT EXECUTE ON FUNCTION public.test_db_rpc_validation() TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_leaderboard') THEN
    GRANT EXECUTE ON FUNCTION public.get_leaderboard(pg_catalog.text, pg_catalog.int4) TO anon, authenticated;
  END IF;
END $$;

-- Grant SELECT on profiles to anon & authenticated for ranking views
DROP POLICY IF EXISTS "Users can view all profiles for ranking" ON public.profiles;
CREATE POLICY "Users can view all profiles for ranking" 
  ON public.profiles 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;

-- Update debug_create_persona_player to grant weekly scores so weekly rankings show dummy players in dev
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname pg_catalog.text, p_persona_type pg_catalog.text DEFAULT 'regular'::pg_catalog.text)
 RETURNS pg_catalog.jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_user_id pg_catalog.uuid := extensions.gen_random_uuid();
    v_world_id pg_catalog.text := 'math_world'::pg_catalog.text;
    v_base_score pg_catalog.int4;
    v_total_score pg_catalog.int8 := 0::pg_catalog.int8;
    v_theme_code pg_catalog.int2;
    v_mode_code pg_catalog.int2 := 1; 
    v_theme_id pg_catalog.text;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || pg_catalog.replace(v_user_id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text) || '@solve-climb.local', 
            pg_catalog.jsonb_build_object('is_dummy'::pg_catalog.text, true::pg_catalog.bool, 'nickname'::pg_catalog.text, p_nickname), 'authenticated', 'authenticated', FALSE, FALSE, pg_catalog.now(), pg_catalog.now());

    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0::pg_catalog.int8, 1000::pg_catalog.int4, 10::pg_catalog.int4)
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_dummy = EXCLUDED.is_dummy, persona_type = EXCLUDED.persona_type;

    FOR v_theme_id IN SELECT unnest(ARRAY['math_add'::pg_catalog.text, 'math_sub'::pg_catalog.text, 'math_mul'::pg_catalog.text, 'math_div'::pg_catalog.text]) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                v_base_score := ((10 + (i - 1) * 5) * 10)::pg_catalog.int4;
                INSERT INTO public.user_level_records (user_id, world_id, mode_code, theme_code, level, best_score, category_id, subject_id)
                VALUES (v_user_id, v_world_id, v_mode_code, v_theme_code, i, v_base_score::pg_catalog.int8, pg_catalog.split_part(v_theme_id, '_'::pg_catalog.text, 1), pg_catalog.split_part(v_theme_id, '_'::pg_catalog.text, 2))
                ON CONFLICT (user_id, theme_code, level, mode_code) DO NOTHING;
                v_total_score := v_total_score + v_base_score;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE public.profiles 
    SET total_mastery_score = v_total_score,
        weekly_score_total = v_total_score,
        weekly_score_timeattack = (v_total_score / 2)::pg_catalog.int8,
        weekly_score_survival = (v_total_score / 2)::pg_catalog.int8
    WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object('success'::pg_catalog.text, true::pg_catalog.bool, 'user_id'::pg_catalog.text, v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_create_persona_player(pg_catalog.text, pg_catalog.text) TO anon, authenticated;

-- Update submit_game_result to increment weekly and mode scores on profiles table
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
      v_correct_answer := (v_question->>'correct_answer')::pg_catalog.int4;
      IF v_user_answer = v_correct_answer THEN
        v_correct_count := v_correct_count + 1;
      ELSE
        v_wrong_answers := v_wrong_answers || pg_catalog.jsonb_build_object(
          'question_id', v_question_id,
          'user_answer', v_user_answer,
          'correct_answer', v_correct_answer,
          'content', v_question->>'content'
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

  v_theme_id := p_category || '_' || p_subject;
  SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

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
