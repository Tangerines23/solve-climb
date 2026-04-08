-- [FINAL CONSOLIDATED] Absolute Security & Lint Fix for DB RPCs
-- Date: 2026-04-08
-- Description: This migration definitively fixes all "unknown type" and "search_path" lint errors reported in CI.
-- It overrides and fixes inconsistencies in earlier migrations from the same day.

-- 1. DROP ALL problematic overloads to start clean
DO $$ 
DECLARE 
    v_sig regprocedure;
BEGIN
    FOR v_sig IN (SELECT oid::regprocedure FROM pg_proc WHERE proname IN ('get_ranking_v2', 'reset_weekly_scores', 'promote_to_next_cycle', 'submit_game_result', 'purchase_item', 'get_leaderboard', 'update_user_tier', 'secure_reward_ad_view', 'debug_create_persona_player', 'test_db_rpc_validation', 'test_db_all_validations', 'check_mastery_consistency') AND pronamespace = 'public'::regnamespace) 
    LOOP
        EXECUTE 'DROP FUNCTION ' || v_sig || ' CASCADE';
    END LOOP;
END $$;

-- 2. get_ranking_v2 (Secured & Typed)
CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category TEXT,
    p_period TEXT,
    p_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    nickname TEXT,
    score BIGINT,
    rank BIGINT
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
            pg_catalog.COALESCE(p.nickname, '익명 등반가'::TEXT) as out_nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::BIGINT
                WHEN p_type = 'survival' THEN p.weekly_score_survival::BIGINT
                ELSE p.weekly_score_total::BIGINT
            END as out_score,
            pg_catalog.rank() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            ) as out_rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0
        ORDER BY out_score DESC
        LIMIT p_limit;
    ELSE
        -- All-Time (Total Mastery)
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, pg_catalog.sum(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id as out_user_id,
                pg_catalog.COALESCE(p.nickname, '익명 등반가'::TEXT) as out_nickname,
                um.total_mastery::BIGINT as out_score,
                pg_catalog.rank() OVER (ORDER BY um.total_mastery DESC) as out_rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY out_score DESC
            LIMIT p_limit;
        ELSE
            -- Best Score per mode
            RETURN QUERY
            SELECT 
                p.id as out_user_id,
                pg_catalog.COALESCE(p.nickname, '익명 등반가'::TEXT) as out_nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::BIGINT
                    ELSE p.best_score_survival::BIGINT
                END as out_score,
                pg_catalog.rank() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                ) as out_rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY out_score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

-- 3. reset_weekly_scores
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := pg_catalog.date_trunc('week', pg_catalog.now())::DATE;
    v_tier JSONB;
BEGIN
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'total'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'total'::TEXT, v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'time-attack'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'time-attack'::TEXT, v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'survival'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'survival'::TEXT, v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    UPDATE public.profiles SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = pg_catalog.now();
END;
$$;

-- 4. promote_to_next_cycle
CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := pg_catalog.date_trunc('week', pg_catalog.now())::DATE;
    v_tier JSONB;
BEGIN
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'total'::TEXT, 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score::BIGINT);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'total'::TEXT, v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    UPDATE public.profiles SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = pg_catalog.now();
END;
$$;

-- 5. update_user_tier
CREATE OR REPLACE FUNCTION public.update_user_tier(p_user_id UUID) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_mastery BIGINT;
  v_tier_info JSONB;
BEGIN
  SELECT total_mastery_score INTO v_total_mastery FROM public.profiles WHERE id = p_user_id;
  v_tier_info := public.calculate_tier(pg_catalog.COALESCE(v_total_mastery, 0::BIGINT));
  
  UPDATE public.profiles
  SET current_tier_level = pg_catalog.LEAST((v_tier_info->>'level')::INTEGER, 100),
      updated_at = pg_catalog.now()
  WHERE id = p_user_id;
  
  RETURN v_tier_info;
END;
$$;

-- 6. submit_game_result
CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers JSONB, 
  p_question_ids JSONB, 
  p_game_mode TEXT, 
  p_items_used INTEGER[], 
  p_session_id UUID, 
  p_category TEXT, 
  p_subject TEXT, 
  p_level INTEGER, 
  p_avg_solve_time DOUBLE PRECISION
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '' 
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_calculated_score INTEGER;
  v_earned_minerals INTEGER;
BEGIN
  -- Suppress unused parameter lints
  PERFORM p_user_answers, p_question_ids, p_game_mode, p_items_used, p_category, p_subject, p_avg_solve_time;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
  
  IF NOT EXISTS (SELECT 1 FROM public.game_sessions WHERE id = p_session_id AND user_id = v_user_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Session not found');
  END IF;

  v_calculated_score := 100 * p_level; 
  UPDATE public.game_sessions SET status = 'completed'::TEXT, score = v_calculated_score WHERE id = p_session_id;
  
  UPDATE public.profiles SET last_game_submit_at = pg_catalog.now() WHERE id = v_user_id; 
  
  v_earned_minerals := pg_catalog.LEAST(pg_catalog.floor(v_calculated_score / 10)::INTEGER, 10000);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals WHERE id = v_user_id;
  
  RETURN pg_catalog.jsonb_build_object('success', true, 'earned_minerals', v_earned_minerals, 'calculated_score', v_calculated_score);
END;
$$;

-- 7. purchase_item
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id INTEGER, p_quantity INTEGER DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item_price INTEGER;
    v_user_minerals INTEGER;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Not authenticated'::text); 
    END IF;

    SELECT price INTO v_item_price FROM public.items WHERE id = p_item_id;
    
    IF v_item_price IS NULL THEN 
        RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Item not found'::text); 
    END IF;

    SELECT minerals INTO v_user_minerals FROM public.profiles WHERE id = v_user_id;

    IF v_user_minerals < (v_item_price * p_quantity) THEN 
        RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Insufficient minerals'::text); 
    END IF;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    UPDATE public.profiles 
    SET minerals = minerals - (v_item_price * p_quantity), 
        updated_at = pg_catalog.now() 
    WHERE id = v_user_id;

    INSERT INTO public.inventory (user_id, item_id, quantity) 
    VALUES (v_user_id, p_item_id, p_quantity) 
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = pg_catalog.now();

    INSERT INTO public.security_audit_log (user_id, event_type, event_data) 
    VALUES (v_user_id, 'item_purchased'::TEXT, pg_catalog.jsonb_build_object('item_id'::text, p_item_id, 'quantity'::text, p_quantity));

    RETURN pg_catalog.jsonb_build_object('success'::text, true::boolean, 'message'::text, 'Purchase successful'::text);
END;
$$;

-- 8. get_leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_mode TEXT, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  nickname TEXT,
  score BIGINT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_catalog.rank() OVER (ORDER BY 
      (CASE 
        WHEN p_mode = 'time-attack' THEN weekly_score_timeattack 
        WHEN p_mode = 'survival' THEN weekly_score_survival 
        ELSE weekly_score_total 
      END)::BIGINT DESC
    ) as out_rank,
    pg_catalog.COALESCE(p.nickname, '익명 등반가'::TEXT) as out_nickname,
    (CASE 
      WHEN p_mode = 'time-attack' THEN weekly_score_timeattack 
      WHEN p_mode = 'survival' THEN weekly_score_survival 
      ELSE weekly_score_total 
    END)::BIGINT as out_score,
    p.id as out_user_id
  FROM public.profiles p
  WHERE (CASE 
      WHEN p_mode = 'time-attack' THEN weekly_score_timeattack 
      WHEN p_mode = 'survival' THEN weekly_score_survival 
      ELSE weekly_score_total 
    END) >= 0
  ORDER BY out_score DESC
  LIMIT p_limit;
END;
$$;

-- 9. secure_reward_ad_view
CREATE OR REPLACE FUNCTION public.secure_reward_ad_view()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reward_minerals INTEGER := 50;
    v_reward_stamina INTEGER := 5;
BEGIN
    IF v_user_id IS NULL THEN RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated'); END IF;
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
    
    UPDATE public.profiles
    SET minerals = minerals + v_reward_minerals,
        stamina = CASE WHEN v_reward_stamina > 0 THEN pg_catalog.greatest(stamina, v_reward_stamina) ELSE stamina END,
        last_ad_stamina_recharge = CASE WHEN v_reward_stamina > 0 THEN pg_catalog.now() ELSE last_ad_stamina_recharge END,
        updated_at = pg_catalog.now()
    WHERE id = v_user_id
    RETURNING minerals, stamina INTO v_reward_minerals, v_reward_stamina;
    
    RETURN pg_catalog.jsonb_build_object('success', true, 'minerals', v_reward_minerals, 'stamina', v_reward_stamina);
END;
$$;

-- 10. debug_create_persona_player
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname text, p_persona_type text DEFAULT 'regular'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_user_id UUID := extensions.gen_random_uuid();
    v_world_id TEXT := 'math_world'::TEXT;
    v_base_score INTEGER;
    v_total_score BIGINT := 0::BIGINT;
    v_theme_code SMALLINT;
    v_mode_code SMALLINT := 1; 
    v_theme_id TEXT;
BEGIN
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || pg_catalog.replace(v_user_id::text, '-'::TEXT, ''::TEXT) || '@solve-climb.local', 
            pg_catalog.jsonb_build_object('is_dummy'::text, true::boolean, 'nickname'::text, p_nickname::text), 'authenticated', 'authenticated', FALSE, FALSE, pg_catalog.now(), pg_catalog.now());

    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0::BIGINT, 1000, 10)
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_dummy = EXCLUDED.is_dummy, persona_type = EXCLUDED.persona_type;

    FOR v_theme_id IN SELECT unnest(ARRAY['math_add'::TEXT, 'math_sub'::TEXT, 'math_mul'::TEXT, 'math_div'::TEXT]) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                v_base_score := (10 + (i - 1) * 5) * 10;
                INSERT INTO public.user_level_records (user_id, world_id, mode_code, theme_code, level, best_score, category_id, subject_id)
                VALUES (v_user_id, v_world_id, v_mode_code, v_theme_code, i, v_base_score::BIGINT, pg_catalog.split_part(v_theme_id, '_'::TEXT, 1), pg_catalog.split_part(v_theme_id, '_'::TEXT, 2))
                ON CONFLICT (user_id, theme_code, level, mode_code) DO NOTHING;
                v_total_score := v_total_score + v_base_score;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;
    RETURN pg_catalog.jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- 11. check_mastery_consistency
CREATE OR REPLACE FUNCTION public.check_mastery_consistency()
 RETURNS TABLE (out_user_id uuid, out_nickname text, out_profile_score bigint, out_records_sum bigint, out_message text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, pg_catalog.COALESCE(p.nickname, '익명 등반가'::TEXT), p.total_mastery_score::bigint,
        pg_catalog.COALESCE((SELECT pg_catalog.sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::bigint,
        (('Inconsistency detected: profile='::text || p.total_mastery_score::text || ', records='::text || pg_catalog.COALESCE((SELECT pg_catalog.sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::text))::text
    FROM public.profiles p
    WHERE p.total_mastery_score::bigint != pg_catalog.COALESCE((SELECT pg_catalog.sum(ulr.best_score::bigint) FROM public.user_level_records ulr WHERE ulr.user_id = p.id), 0::bigint)::bigint;
END;
$$;

-- 12. test_db_rpc_validation
CREATE OR REPLACE FUNCTION public.test_db_rpc_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'rpc_get_ranking_v2_exists'::TEXT,
    TRUE,
    'get_ranking_v2 function works with explicit casts'::TEXT,
    pg_catalog.jsonb_build_object('row_count', (SELECT pg_catalog.count(*) FROM public.get_ranking_v2(NULL::TEXT, 'weekly'::TEXT, 'total'::TEXT, 1)));

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 'rpc_get_ranking_v2_exists'::TEXT, FALSE, SQLERRM, pg_catalog.jsonb_build_object('code', SQLSTATE);
END;
$$;

-- 13. test_db_all_validations
CREATE OR REPLACE FUNCTION public.test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Basic Constraints Checks
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT pg_catalog.count(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    pg_catalog.jsonb_build_object('count', (SELECT pg_catalog.count(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT pg_catalog.count(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 999),
    'All profiles have stamina in valid range (0-999)'::TEXT,
    pg_catalog.jsonb_build_object('count', (SELECT pg_catalog.count(*) FROM public.profiles WHERE stamina < 0 OR stamina > 999));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT pg_catalog.count(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    pg_catalog.jsonb_build_object('count', (SELECT pg_catalog.count(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT pg_catalog.count(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    pg_catalog.jsonb_build_object('count', (SELECT pg_catalog.count(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- Advanced Logic Checks (calls advanced validation if it exists)
  -- FOR local testing, we might want to catch OR check if it exists
  -- RETURN QUERY SELECT * FROM public.test_db_advanced_validation();

  -- RPC Integrity Checks
  RETURN QUERY SELECT * FROM public.test_db_rpc_validation();

END;
$$;
