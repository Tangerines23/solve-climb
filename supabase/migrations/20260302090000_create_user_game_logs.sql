-- Create user_game_logs table
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

-- Enable RLS
ALTER TABLE public.user_game_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_game_logs;
CREATE POLICY "Users can view their own logs" 
ON public.user_game_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_user_game_logs_user_id ON public.user_game_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_logs_created_at ON public.user_game_logs(created_at DESC);

-- Update submit_game_result to include logging and stats update
CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers INTEGER[],
  p_question_ids UUID[],
  p_game_mode TEXT,
  p_items_used INTEGER[],
  p_session_id UUID,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_avg_solve_time FLOAT DEFAULT 0.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_old_best_score INTEGER;
  v_new_best_score INTEGER;
  v_score_diff INTEGER;
  v_calculated_score INTEGER := 0;
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_previous_tier JSON;
  v_current_tier JSON;
  v_tier_upgraded BOOLEAN := false;
  v_theme_code SMALLINT;
  v_mode_code SMALLINT;
  v_is_debug_session BOOLEAN;
  -- Log variables
  v_correct_count INTEGER := 0;
  v_total_questions INTEGER;
  v_wrong_answers JSONB := '[]'::jsonb;
  v_session_questions JSONB;
  v_question JSONB;
  v_question_id UUID;
  v_user_answer INTEGER;
  v_correct_answer INTEGER;
  v_mode_weight NUMERIC := 1.0;
  -- Const variables
  MAX_SCORE INTEGER := 1000000;
  MAX_MINERALS INTEGER := 10000;
  MAX_LEVEL INTEGER := 100;
  MIN_LEVEL INTEGER := 1;
  MINERALS_PER_SCORE INTEGER := 100;
BEGIN
  -- Explicitly use parameters to satisfy linter
  PERFORM p_items_used;

  -- 0. Debug session check
  SELECT is_debug_session INTO v_is_debug_session
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;
  
  -- 1. Authentication Check
  IF v_user_id IS NULL THEN
    RETURN JSONB_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- 2. Validation
  IF p_game_mode NOT IN ('timeattack', 'survival', 'infinite') THEN
    RETURN JSONB_build_object('success', false, 'error', 'Invalid game mode');
  END IF;
  
  -- 6. Session Check & Idempotency
  DECLARE
    v_session_status TEXT;
    v_session_score INTEGER;
    v_previous_result JSONB;
  BEGIN
    SELECT status, score, result INTO v_session_status, v_session_score, v_previous_result
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    IF v_session_status IS NULL THEN
      RETURN JSONB_build_object('success', false, 'error', 'Game session not found');
    END IF;
    
    IF v_session_status = 'completed' THEN
      RETURN COALESCE(v_previous_result, JSONB_build_object('success', true, 'idempotent', true));
    END IF;
  END;
  
  -- 9. Scoring and Data Collection
  SELECT questions INTO v_session_questions
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;
  
  v_total_questions := array_length(p_question_ids, 1);
  FOR v_question_index IN 1..v_total_questions LOOP
    v_question_id := p_question_ids[v_question_index];
    v_user_answer := p_user_answers[v_question_index];
    
    SELECT q INTO v_question
    FROM JSONB_array_elements(v_session_questions) AS q
    WHERE (q->>'id')::UUID = v_question_id;
    
    IF v_question IS NULL THEN CONTINUE; END IF;
    
    v_correct_answer := (v_question->>'correct_answer')::INTEGER;
    
    IF v_user_answer = v_correct_answer THEN
      v_correct_count := v_correct_count + 1;
    ELSE
      -- Collect wrong answer info
      v_wrong_answers := v_wrong_answers || JSONB_build_object(
        'question', v_question->>'content',
        'wrong_answer', v_user_answer,
        'correct_answer', v_correct_answer
      );
    END IF;
  END LOOP;
  
  IF p_game_mode = 'survival' THEN v_mode_weight := 0.8; ELSE v_mode_weight := 1.0; END IF;
  v_calculated_score := FLOOR((v_correct_count * 100.0 / GREATEST(v_total_questions, 1)) * p_level * v_mode_weight);
  
  -- Update user_statistics
  INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions, last_played_at, updated_at)
  VALUES (v_user_id, 1, v_correct_count, v_total_questions, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
      total_games = user_statistics.total_games + 1,
      total_correct = user_statistics.total_correct + v_correct_count,
      total_questions = user_statistics.total_questions + v_total_questions,
      avg_solve_time = CASE 
          WHEN user_statistics.total_games = 0 THEN p_avg_solve_time 
          ELSE (user_statistics.avg_solve_time * user_statistics.total_games + p_avg_solve_time) / (user_statistics.total_games + 1) 
      END,
      last_played_at = NOW(),
      updated_at = NOW();

  -- Insert into user_game_logs
  INSERT INTO public.user_game_logs (
    user_id, game_mode, world_id, category_id, level, score, correct_count, total_questions, avg_solve_time, wrong_answers
  ) VALUES (
    v_user_id, p_game_mode, p_category, p_subject, p_level, v_calculated_score, v_correct_count, v_total_questions, p_avg_solve_time, v_wrong_answers
  );

  -- Existing Logic (Masters, Tiers, etc.)
  -- Theme/Mode Codes
  v_theme_id := p_category || '_' || p_subject;
  SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
  SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;
  
  -- Update Session
  UPDATE public.game_sessions SET status = 'completed', score = v_calculated_score WHERE id = p_session_id;
  
  -- Minerals
  v_earned_minerals := LEAST(FLOOR(v_calculated_score / MINERALS_PER_SCORE), MAX_MINERALS);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals, last_game_submit_at = NOW() WHERE id = v_user_id;
  
  -- Mastery/Tier
  SELECT best_score INTO v_old_best_score FROM public.user_level_records 
  WHERE user_id = v_user_id AND theme_code = v_theme_code AND level = p_level AND mode_code = v_mode_code;
  
  v_new_best_score := GREATEST(COALESCE(v_old_best_score, 0), v_calculated_score);
  IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
    v_score_diff := v_new_best_score - COALESCE(v_old_best_score, 0);
    INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score)
    VALUES (v_user_id, v_theme_code, p_level, v_mode_code, v_new_best_score)
    ON CONFLICT (user_id, theme_code, level, mode_code) DO UPDATE SET best_score = v_new_best_score, updated_at = NOW();
    
    UPDATE public.profiles SET total_mastery_score = total_mastery_score + v_score_diff WHERE id = v_user_id;
    v_previous_tier := public.calculate_tier((SELECT total_mastery_score - v_score_diff FROM public.profiles WHERE id = v_user_id)::INTEGER);
    v_current_tier := public.update_user_tier(v_user_id);
    -- Tier Upgrade Check (Simplified for this log)
    IF (v_current_tier->>'stars')::INTEGER > (v_previous_tier->>'stars')::INTEGER OR 
       ((v_current_tier->>'stars')::INTEGER = (v_previous_tier->>'stars')::INTEGER AND (v_current_tier->>'level')::INTEGER > (v_previous_tier->>'level')::INTEGER) THEN
      v_tier_upgraded := true;
    END IF;
  ELSE
    v_current_tier := public.calculate_tier((SELECT total_mastery_score FROM public.profiles WHERE id = v_user_id)::INTEGER);
  END IF;

  -- Result Build
  DECLARE
    v_final_result JSON;
  BEGIN
    v_final_result := JSONB_build_object(
      'success', true,
      'new_record', v_new_best_score > COALESCE(v_old_best_score, 0),
      'tier_upgraded', v_tier_upgraded,
      'tier_info', v_current_tier,
      'earned_minerals', v_earned_minerals,
      'calculated_score', v_calculated_score
    );
    UPDATE public.game_sessions SET result = v_final_result::JSONB WHERE id = p_session_id;
    RETURN v_final_result;
  END;
END;
$$;

-- New function to get recent game logs
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
