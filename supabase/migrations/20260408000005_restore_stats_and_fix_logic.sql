-- 1. Restore user_statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    avg_solve_time FLOAT DEFAULT 0.0,
    last_played_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_positive_counts CHECK (total_games >= 0 AND total_correct >= 0 AND total_questions >= 0)
);

COMMENT ON TABLE public.user_statistics IS 'User lifetime cumulative statistics (Total games, total questions, etc.)';

-- 2. Restore user_game_logs table
CREATE TABLE IF NOT EXISTS public.user_game_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_mode TEXT NOT NULL,
    world_id TEXT,
    category_id TEXT,
    level INTEGER,
    score INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    avg_solve_time FLOAT DEFAULT 0.0,
    wrong_answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_game_logs IS 'Detailed history of every completed game session including wrong answers for analytics.';

-- 3. Enable RLS and Security
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_statistics;
CREATE POLICY "Users can view their own stats" ON public.user_statistics FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_game_logs;
CREATE POLICY "Users can view their own logs" ON public.user_game_logs FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_game_logs_user_id ON public.user_game_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_logs_created_at ON public.user_game_logs(created_at DESC);

-- 4. Overhaul submit_game_result to fix logic and record data
CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers JSONB,
  p_question_ids JSONB,
  p_game_mode TEXT,
  p_items_used JSONB,
  p_session_id UUID,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_avg_solve_time FLOAT DEFAULT 0.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_calculated_score INTEGER := 0;
  v_correct_count INTEGER := 0;
  v_total_questions INTEGER := 0;
  v_wrong_answers JSONB := '[]'::jsonb;
  v_session_questions JSONB;
  v_question JSONB;
  v_question_id UUID;
  v_user_answer INTEGER;
  v_correct_answer INTEGER;
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_theme_code SMALLINT;
  v_mode_code SMALLINT;
  v_old_best_score INTEGER;
  v_new_best_score INTEGER;
  v_score_diff INTEGER;
  v_tier_info JSONB;
  v_mode_weight NUMERIC := 1.0;
  v_is_debug BOOLEAN := false;
  v_session_status TEXT;
  v_prev_result JSONB;
  
  -- Constants
  MINERALS_PER_SCORE CONSTANT INTEGER := 100;
  MAX_MINERALS CONSTANT INTEGER := 1000;
BEGIN
  -- 1. Authentication Check
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- 2. Debug Mode Check
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_debug FROM public.game_config WHERE key = 'debug_mode_enabled';

  -- 3. Session Validation & Idempotency
  SELECT status, result INTO v_session_status, v_prev_result
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF v_session_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session_status = 'completed' THEN
    RETURN COALESCE(v_prev_result, jsonb_build_object('success', true, 'idempotent', true));
  END IF;

  -- 4. Accuracy Calculation & Answer Validation
  SELECT questions INTO v_session_questions FROM public.game_sessions WHERE id = p_session_id;
  v_total_questions := jsonb_array_length(p_question_ids);
  
  -- Loop through submitted answers
  FOR i IN 0..(v_total_questions - 1) LOOP
    v_question_id := (p_question_ids->>i)::UUID;
    v_user_answer := (p_user_answers->>i)::INTEGER;

    -- Find matching question in session
    SELECT q INTO v_question 
    FROM jsonb_array_elements(v_session_questions) AS q 
    WHERE (q->>'id')::UUID = v_question_id;

    IF v_question IS NOT NULL THEN
      v_correct_answer := (v_question->>'correct_answer')::INTEGER;
      IF v_user_answer = v_correct_answer THEN
        v_correct_count := v_correct_count + 1;
      ELSE
        v_wrong_answers := v_wrong_answers || jsonb_build_object(
          'question_id', v_question_id,
          'user_answer', v_user_answer,
          'correct_answer', v_correct_answer,
          'content', v_question->>'content'
        );
      END IF;
    END IF;
  END LOOP;

  -- 5. Score Calculation
  IF p_game_mode = 'survival' THEN v_mode_weight := 0.8; END IF;
  
  -- Logic: (Correct Ratio) * Level * Mode Weight * 100
  v_calculated_score := FLOOR((v_correct_count::NUMERIC / GREATEST(v_total_questions, 1)) * p_level * v_mode_weight * 100);

  -- 6. Update Permanent Stats (Atomic)
  INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions, last_played_at, updated_at)
  VALUES (v_user_id, 1, v_correct_count, v_total_questions, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    total_games = user_statistics.total_games + 1,
    total_correct = user_statistics.total_correct + EXCLUDED.total_correct,
    total_questions = user_statistics.total_questions + EXCLUDED.total_questions,
    avg_solve_time = CASE 
      WHEN user_statistics.total_games = 0 THEN p_avg_solve_time 
      ELSE (user_statistics.avg_solve_time * user_statistics.total_games + p_avg_solve_time) / (user_statistics.total_games + 1)
    END,
    last_played_at = NOW(),
    updated_at = NOW();

  -- 7. Log Game Session
  INSERT INTO public.user_game_logs (
    user_id, game_mode, world_id, category_id, level, score, correct_count, total_questions, avg_solve_time, wrong_answers
  ) VALUES (
    v_user_id, p_game_mode, p_category, p_subject, p_level, v_calculated_score, v_correct_count, v_total_questions, p_avg_solve_time, v_wrong_answers
  );

  -- 8. Theme/Mode Mapping
  v_theme_id := p_category || '_' || p_subject;
  SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

  -- 9. Update Minerals (Profile)
  v_earned_minerals := LEAST(FLOOR(v_calculated_score::NUMERIC / MINERALS_PER_SCORE), MAX_MINERALS);
  
  -- Bypass security triggers for profile update within RPC
  PERFORM set_config('app.bypass_profile_security', '1', true);
  
  UPDATE public.profiles 
  SET minerals = minerals + v_earned_minerals,
      last_game_submit_at = NOW()
  WHERE id = v_user_id;

  -- 10. Update Mastery & Tier
  SELECT best_score INTO v_old_best_score 
  FROM public.user_level_records 
  WHERE user_id = v_user_id AND theme_code = v_theme_code AND level = p_level AND mode_code = v_mode_code;

  v_new_best_score := GREATEST(COALESCE(v_old_best_score, 0), v_calculated_score);
  
  IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
    v_score_diff := v_new_best_score - COALESCE(v_old_best_score, 0);
    
    INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score, updated_at)
    VALUES (v_user_id, v_theme_code, p_level, v_mode_code, v_new_best_score, NOW())
    ON CONFLICT (user_id, theme_code, level, mode_code) 
    DO UPDATE SET best_score = v_new_best_score, updated_at = NOW();

    UPDATE public.profiles SET total_mastery_score = total_mastery_score + v_score_diff WHERE id = v_user_id;
  END IF;

  v_tier_info := public.update_user_tier(v_user_id);
  
  PERFORM set_config('app.bypass_profile_security', '0', true);

  -- 11. Finalize Session
  v_prev_result := jsonb_build_object(
    'success', true,
    'calculated_score', v_calculated_score,
    'correct_count', v_correct_count,
    'total_questions', v_total_questions,
    'earned_minerals', v_earned_minerals,
    'new_record', v_new_best_score > COALESCE(v_old_best_score, 0),
    'tier_info', v_tier_info
  );

  UPDATE public.game_sessions 
  SET status = 'completed', 
      score = v_calculated_score,
      result = v_prev_result
  WHERE id = p_session_id;

  RETURN v_prev_result;
END;
$$;

-- 5. Restore utility functions
CREATE OR REPLACE FUNCTION public.get_user_game_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stats RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_stats FROM public.user_statistics WHERE id = v_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.user_statistics (id) VALUES (v_user_id) RETURNING * INTO v_stats;
    END IF;

    RETURN jsonb_build_object(
        'total_games', v_stats.total_games,
        'total_correct', v_stats.total_correct,
        'total_questions', v_stats.total_questions,
        'best_streak', v_stats.best_streak,
        'avg_solve_time', v_stats.avg_solve_time,
        'last_played_at', v_stats.last_played_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_game_logs(p_limit INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_logs JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_agg(l) INTO v_logs
    FROM (
        SELECT id, game_mode, world_id, category_id, level, score, correct_count, total_questions, avg_solve_time, created_at, wrong_answers
        FROM public.user_game_logs
        WHERE user_id = v_user_id
        ORDER BY created_at DESC
        LIMIT p_limit
    ) l;

    RETURN v_logs;
END;
$$;
