-- Migration: Fix debug dummy player creation and deletion RPCs
-- Date: 2026-08-24
-- Description: Sets app.bypass_profile_security in debug_create_persona_player, handles all FK cascading deletions in debug_delete_dummy_user and debug_delete_all_dummies, and grants EXECUTE to anon and authenticated.

-- 1. debug_create_persona_player
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
    -- Security bypass for profile creation
    PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);

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

-- 2. debug_delete_dummy_user
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

    PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);

    DELETE FROM public.inventory WHERE user_id = p_user_id;
    DELETE FROM public.user_badges WHERE user_id = p_user_id;
    DELETE FROM public.game_sessions WHERE user_id = p_user_id;
    DELETE FROM public.user_level_records WHERE user_id = p_user_id;
    DELETE FROM public.user_statistics WHERE id = p_user_id;
    DELETE FROM public.user_game_logs WHERE user_id = p_user_id;
    DELETE FROM public.hall_of_fame WHERE user_id = p_user_id;
    DELETE FROM public.security_audit_log WHERE user_id = p_user_id;
    DELETE FROM public.user_identities WHERE user_id = p_user_id;
    DELETE FROM public.profiles WHERE id = p_user_id;
    DELETE FROM auth.users WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. debug_delete_all_dummies
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

    PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);

    DELETE FROM public.inventory WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_badges WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.game_sessions WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_level_records WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_statistics WHERE id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_game_logs WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.hall_of_fame WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.security_audit_log WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.user_identities WHERE user_id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.profiles WHERE is_dummy = true;
    DELETE FROM auth.users WHERE email LIKE 'dummy_%@solve-climb.local';

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grants
GRANT EXECUTE ON FUNCTION public.debug_create_persona_player(pg_catalog.text, pg_catalog.text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debug_delete_dummy_user(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debug_delete_all_dummies() TO anon, authenticated;
