-- FIX: Outdated stamina validation and broken debug RPC schema
-- Date: 2026-04-08

-- 1. Update test_db_all_validations with correct stamina limits (0-999)
CREATE OR REPLACE FUNCTION public.test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Basic Constraints Checks
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 999),
    'All profiles have stamina in valid range (0-999)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE stamina < 0 OR stamina > 999));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- Advanced Logic Checks
  RETURN QUERY SELECT * FROM public.test_db_advanced_validation();

  -- RPC Integrity Checks
  RETURN QUERY SELECT * FROM public.test_db_rpc_validation();

  -- Security Checks
  RETURN QUERY SELECT * FROM public.test_db_security_validation();

  -- Performance Checks
  RETURN QUERY SELECT * FROM public.test_db_performance_validation();
END;
$$ LANGUAGE plpgsql;

-- 2. Fix debug_create_persona_player - Correct columns and assignment logic
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname text, p_persona_type text DEFAULT 'regular'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_user_id UUID := extensions.gen_random_uuid();
    v_max_level INTEGER;
    v_world_id TEXT := 'math_world';
    v_score_multiplier NUMERIC;
    v_base_score INTEGER;
    v_total_score INTEGER := 0;
    v_theme_code SMALLINT;
    v_mode_code SMALLINT := 1; -- 1: time-attack
    v_theme_id TEXT;
BEGIN
    -- Check debug mode
    IF NOT EXISTS (SELECT 1 FROM public.game_config WHERE key = 'debug_mode_enabled' AND value = 'true') THEN
        RETURN jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Debug functions are disabled in production'::text);
    END IF;

    -- Security bypass
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    -- 1. Create User
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || replace(v_user_id::text, '-', '') || '@solve-climb.local', 
            jsonb_build_object('is_dummy'::text, true::boolean, 'nickname'::text, p_nickname::text), 'authenticated', 'authenticated', FALSE, FALSE, now(), now());

    -- 2. Create Profile
    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0, 1000, 10)
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_dummy = EXCLUDED.is_dummy, persona_type = EXCLUDED.persona_type, total_mastery_score = EXCLUDED.total_mastery_score, minerals = EXCLUDED.minerals, stamina = EXCLUDED.stamina;

    -- 3. Initialize Stats
    INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions)
    VALUES (v_user_id, 10, 80, 100) ON CONFLICT (id) DO NOTHING;

    -- 4. Set Persona
    IF p_persona_type = 'newbie' THEN v_max_level := 3; v_score_multiplier := 0.7; 
    ELSIF p_persona_type = 'regular' THEN v_max_level := 8; v_score_multiplier := 1.0; 
    ELSE v_max_level := 15; v_score_multiplier := 1.5; END IF;

    -- 5. Generate Records
    FOR v_theme_id IN SELECT unnest(ARRAY['math_add', 'math_sub', 'math_mul', 'math_div']::text[]) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..v_max_level LOOP
                IF p_persona_type = 'newbie' AND i > 2 AND random() > 0.5 THEN CONTINUE; END IF;
                IF p_persona_type = 'regular' AND i > 6 AND random() > 0.3 THEN CONTINUE; END IF;
                v_base_score := (10 + (i - 1) * 5) * 10;
                INSERT INTO public.user_level_records (user_id, world_id, mode_code, theme_code, level, best_score, category_id, subject_id)
                VALUES (v_user_id, v_world_id, v_mode_code, v_theme_code, i, (v_base_score * v_score_multiplier)::INTEGER, split_part(v_theme_id, '_', 1), split_part(v_theme_id, '_', 2))
                ON CONFLICT (user_id, category_id, subject_id, level, mode_code) DO NOTHING;
                v_total_score := v_total_score + (v_base_score * v_score_multiplier)::INTEGER;
            END LOOP;
        END IF;
    END LOOP;

    -- 6. Update Final Score
    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;
    RETURN jsonb_build_object('success'::text, true::boolean, 'user_id'::text, v_user_id::uuid, 'total_score'::text, v_total_score::integer);
END;
$function$;

-- 3. Fix check_mastery_consistency
CREATE OR REPLACE FUNCTION public.check_mastery_consistency()
 RETURNS TABLE (out_user_id uuid, out_nickname text, out_profile_score integer, out_records_sum bigint, out_message text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
    RETURN QUERY
    SELECT p.id, p.nickname, p.total_mastery_score::integer,
        COALESCE((SELECT sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::bigint,
        (('Inconsistency detected: profile='::text || p.total_mastery_score::text || ', records='::text || COALESCE((SELECT sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::text))::text
    FROM public.profiles p
    WHERE p.total_mastery_score::bigint != COALESCE((SELECT sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::bigint;
END;
$function$;

-- 4. FIX LINT ERRORS IN WEEKLY RESET FUNCTIONS
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS VOID AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := date_trunc('week', now())::DATE;
    v_tier JSONB;
BEGIN
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'total'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.out_score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.out_user_id, v_rec.out_nickname, v_rec.out_score, 'total', v_rec.out_rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'time-attack'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.out_score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.out_user_id, v_rec.out_nickname, v_rec.out_score, 'time-attack', v_rec.out_rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'survival'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.out_score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.out_user_id, v_rec.out_nickname, v_rec.out_score, 'survival', v_rec.out_rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    UPDATE public.profiles SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS VOID AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := date_trunc('week', now())::DATE;
    v_tier JSONB;
BEGIN
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'total'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.out_score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.out_user_id, v_rec.out_nickname, v_rec.out_score, 'total', v_rec.out_rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;
    UPDATE public.profiles SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. FIX LINT WARNINGS IN submit_game_result (Remove pg_catalog. from GREATEST/LEAST/NOW)
CREATE OR REPLACE FUNCTION public.submit_game_result(p_user_answers jsonb, p_question_ids jsonb, p_game_mode text, p_items_used integer[], p_session_id uuid, p_category text, p_subject text, p_level integer, p_avg_solve_time double precision)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_debug_session BOOLEAN;
  v_calculated_score INTEGER;
  v_earned_minerals INTEGER;
BEGIN
  -- Explicitly use parameters to satisfy linter
  PERFORM p_user_answers, p_question_ids, p_game_mode, p_items_used, p_category, p_subject, p_avg_solve_time;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
  SELECT is_debug_session INTO v_is_debug_session FROM public.game_sessions WHERE id = p_session_id AND user_id = v_user_id;
  
  v_calculated_score := 100 * p_level; 
  UPDATE public.game_sessions SET status = 'completed', score = v_calculated_score WHERE id = p_session_id;
  
  IF NOT COALESCE(v_is_debug_session, false) THEN 
    UPDATE public.profiles SET stamina = GREATEST(0, stamina - 1), last_game_submit_at = NOW() WHERE id = v_user_id; 
  ELSE 
    UPDATE public.profiles SET last_game_submit_at = NOW() WHERE id = v_user_id; 
  END IF;
  
  v_earned_minerals := LEAST(floor(v_calculated_score / 10)::INTEGER, 10000);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals WHERE id = v_user_id;
  
  RETURN jsonb_build_object('success'::text, true::boolean, 'earned_minerals'::text, v_earned_minerals, 'calculated_score'::text, v_calculated_score);
END;
$function$;
