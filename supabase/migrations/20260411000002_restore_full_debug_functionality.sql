-- Restore remaining debug RPCs with hardening
-- Date: 2026-04-11

-- 1. debug_set_tier
DROP FUNCTION IF EXISTS public.debug_set_tier(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.debug_set_tier(
  p_user_id UUID,
  p_level INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  -- Security bypass 
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  UPDATE public.profiles
  SET current_tier_level = p_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN JSONB_build_object('success', true, 'message', 'Tier updated to ' || p_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. debug_set_mastery_score
DROP FUNCTION IF EXISTS public.debug_set_mastery_score(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.debug_set_mastery_score(
  p_user_id UUID,
  p_score INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  -- Security bypass
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  UPDATE public.profiles
  SET total_mastery_score = p_score,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN JSONB_build_object('success', true, 'message', 'Mastery score updated to ' || p_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. debug_grant_badge
DROP FUNCTION IF EXISTS public.debug_grant_badge(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.debug_grant_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (p_user_id, p_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN JSONB_build_object('success', true, 'message', 'Badge granted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. debug_remove_badge
DROP FUNCTION IF EXISTS public.debug_remove_badge(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.debug_remove_badge(
  p_user_id UUID,
  p_badge_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  DELETE FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id = p_badge_id;
  
  RETURN JSONB_build_object('success', true, 'message', 'Badge removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. debug_reset_profile
DROP FUNCTION IF EXISTS public.debug_reset_profile(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.debug_reset_profile(
  p_user_id UUID,
  p_reset_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  -- Security bypass
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  CASE p_reset_type
    WHEN 'all' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          minerals = 0,
          stamina = 5,
          updated_at = NOW()
      WHERE id = p_user_id;
    WHEN 'score' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    WHEN 'minerals' THEN
      UPDATE public.profiles
      SET minerals = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Invalid reset type';
  END CASE;
  
  RETURN JSONB_build_object('success', true, 'message', 'Profile reset (' || p_reset_type || ')');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. debug_reset_level_progress
DROP FUNCTION IF EXISTS public.debug_reset_level_progress(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.debug_reset_level_progress(
    p_user_id UUID,
    p_category_id TEXT,
    p_subject_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  DELETE FROM public.user_level_records
  WHERE user_id = p_user_id 
    AND category_id = p_category_id 
    AND subject_id = p_subject_id;

  RETURN JSONB_build_object('success', true, 'message', 'Level progress reset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. debug_seed_badge_definitions
DROP FUNCTION IF EXISTS public.debug_seed_badge_definitions(JSONB);
CREATE OR REPLACE FUNCTION public.debug_seed_badge_definitions(p_badges JSONB)
RETURNS JSONB AS $$
DECLARE
    v_badge RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_badge IN SELECT * FROM JSONB_to_recordset(p_badges) AS x(id TEXT, name TEXT, description TEXT, emoji TEXT, theme_id TEXT)
    LOOP
        INSERT INTO public.badge_definitions (id, name, description, emoji, theme_id)
        VALUES (v_badge.id, v_badge.name, v_badge.description, v_badge.emoji, v_badge.theme_id)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            emoji = EXCLUDED.emoji,
            theme_id = EXCLUDED.theme_id;
        
        v_count := v_count + 1;
    END LOOP;

    RETURN JSONB_build_object('success', true, 'message', v_count || ' badges seeded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. debug_create_persona_player
DROP FUNCTION IF EXISTS public.debug_create_persona_player(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname text, p_persona_type text DEFAULT 'regular'::text)
 RETURNS jsonb AS $$
DECLARE
    v_user_id UUID := extensions.gen_random_uuid();
    v_max_level INTEGER;
    v_world_id TEXT := 'math_world';
    v_score_multiplier NUMERIC;
    v_base_score INTEGER;
    v_total_score INTEGER := 0;
    v_theme_code SMALLINT;
    v_mode_code SMALLINT := 1; 
    v_theme_id TEXT;
BEGIN
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    IF NOT EXISTS (SELECT 1 FROM public.game_config WHERE key = 'debug_mode_enabled' AND value = 'true') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production');
    END IF;

    -- Create Auth User (Note: In Supabase, we usually don't have direct access to auth.users in standard migrations for dummy creation like this, 
    -- but this logic is kept for consistency with original. In many environments, this requires service_role).
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || replace(v_user_id::text, '-', '') || '@solve-climb.local', 
            jsonb_build_object('is_dummy', true, 'nickname', p_nickname), 'authenticated', 'authenticated', FALSE, FALSE, now(), now());

    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0, 1000, 10);

    IF p_persona_type = 'newbie' THEN v_max_level := 3; v_score_multiplier := 0.7; 
    ELSIF p_persona_type = 'regular' THEN v_max_level := 8; v_score_multiplier := 1.0; 
    ELSE v_max_level := 15; v_score_multiplier := 1.5; END IF;

    FOR v_theme_id IN SELECT unnest(ARRAY['math_add', 'math_sub', 'math_mul', 'math_div']::text[]) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..v_max_level LOOP
                IF p_persona_type = 'newbie' AND i > 2 AND random() > 0.5 THEN CONTINUE; END IF;
                IF p_persona_type = 'regular' AND i > 6 AND random() > 0.3 THEN CONTINUE; END IF;
                
                v_base_score := (10 + (i - 1) * 5) * 10;
                
                INSERT INTO public.user_level_records (user_id, world_id, mode_code, theme_code, level, best_score, category_id, subject_id)
                VALUES (v_user_id, v_world_id, v_mode_code, v_theme_code, i, (v_base_score * v_score_multiplier)::INTEGER,
                        pg_catalog.split_part(v_theme_id, '_', 1), pg_catalog.split_part(v_theme_id, '_', 2));
                
                v_total_score := v_total_score + (v_base_score * v_score_multiplier)::INTEGER;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'total_score', v_total_score, 'message', 'Dummy player created');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. debug_delete_dummy_user
DROP FUNCTION IF EXISTS public.debug_delete_dummy_user(UUID);
CREATE OR REPLACE FUNCTION public.debug_delete_dummy_user(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_is_dev BOOLEAN;
    v_is_dummy boolean;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Debug functions are disabled in production';
    END IF;

    SELECT is_dummy INTO v_is_dummy FROM public.profiles WHERE id = p_user_id;
    IF NOT COALESCE(v_is_dummy, false) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Target user is not a dummy player');
    END IF;

    -- Security bypass for profile deletion (if needed)
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    DELETE FROM public.inventory WHERE user_id = p_user_id;
    DELETE FROM public.user_badges WHERE user_id = p_user_id;
    DELETE FROM public.game_sessions WHERE user_id = p_user_id;
    DELETE FROM public.user_level_records WHERE user_id = p_user_id;
    DELETE FROM public.profiles WHERE id = p_user_id;
    DELETE FROM auth.users WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. debug_delete_all_dummies
DROP FUNCTION IF EXISTS public.debug_delete_all_dummies();
CREATE OR REPLACE FUNCTION public.debug_delete_all_dummies()
RETURNS JSONB AS $$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Debug functions are disabled in production';
    END IF;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    DELETE FROM public.inventory WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_badges WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.game_sessions WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_level_records WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.profiles WHERE is_dummy = true;
    DELETE FROM auth.users WHERE email LIKE 'dummy_%@solve-climb.local';

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. debug_run_play_scenario
DROP FUNCTION IF EXISTS public.debug_run_play_scenario(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION public.debug_run_play_scenario(
    p_user_id UUID,
    p_category_id TEXT,
    p_subject_id TEXT,
    p_level INTEGER,
    p_avg_correct INTEGER,
    p_avg_combo INTEGER,
    p_iterations INTEGER,
    p_game_mode TEXT
) RETURNS JSONB AS $$
DECLARE
    v_total_score INTEGER := 0;
    v_it_result JSONB;
BEGIN
    FOR v_i IN 1..p_iterations LOOP
        -- Internal call to submit_game_result
        SELECT public.submit_game_result(
            '[]'::jsonb, '[]'::jsonb, p_game_mode, ARRAY[]::INTEGER[], 
            extensions.gen_random_uuid(), p_category_id, p_subject_id, p_level, 1.0
        ) INTO v_it_result;

        IF (v_it_result->>'success')::BOOLEAN THEN
            v_total_score := v_total_score + COALESCE((v_it_result->>'calculated_score')::INTEGER, 0);
        END IF;
    END LOOP;

    RETURN JSONB_build_object('success', true, 'total_score_generated', v_total_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 12. debug_set_session_timer
DROP FUNCTION IF EXISTS public.debug_set_session_timer(UUID, NUMERIC);
CREATE OR REPLACE FUNCTION public.debug_set_session_timer(
    p_session_id UUID,
    p_seconds NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  UPDATE public.game_sessions 
  SET expires_at = NOW() + (p_seconds || ' seconds')::INTERVAL
  WHERE id = p_session_id;

  RETURN JSONB_build_object('success', true, 'message', 'Session timer updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grants
GRANT EXECUTE ON FUNCTION public.debug_set_tier(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_mastery_score(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_grant_badge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_remove_badge(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_reset_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_reset_level_progress(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_seed_badge_definitions(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_create_persona_player(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_delete_dummy_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_delete_all_dummies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_run_play_scenario(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_session_timer(UUID, NUMERIC) TO authenticated;
