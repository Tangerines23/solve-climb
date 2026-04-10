-- [FIX] Correct coalesce syntax in debug_create_persona_player
-- Date: 2026-04-10

CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname pg_catalog.text, p_persona_type pg_catalog.text DEFAULT 'regular'::pg_catalog.text)
 RETURNS pg_catalog.jsonb 
 LANGUAGE plpgsql 
 SECURITY DEFINER 
 SET search_path = '' 
AS $$
DECLARE
    v_user_id pg_catalog.uuid := extensions.gen_random_uuid();
    v_world_id pg_catalog.text := 'math_world'::pg_catalog.text;
    v_base_score pg_catalog.int4;
    v_total_score pg_catalog.int8 := 0::pg_catalog.int8;
    v_theme_code pg_catalog.int2;
    v_mode_code pg_catalog.int2 := 1; 
    v_theme_id pg_catalog.text;
BEGIN
    -- 2.1 Debug Mode Check (Use simple COALESCE without pg_catalog prefix for boolean compatibility)
    IF NOT COALESCE((SELECT (value = 'true') FROM public.game_config WHERE key = 'debug_mode_enabled'), false) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production'::pg_catalog.text);
    END IF;

    -- 2.2 Enable Security Bypass
    PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);

    -- 2.3 Create Auth User
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || pg_catalog.replace(v_user_id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text) || '@solve-climb.local', 
            pg_catalog.jsonb_build_object('is_dummy'::pg_catalog.text, true::pg_catalog.bool, 'nickname'::pg_catalog.text, p_nickname), 'authenticated', 'authenticated', FALSE, FALSE, pg_catalog.now(), pg_catalog.now());

    -- 2.4 Create Profile
    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0::pg_catalog.int8, 1000::pg_catalog.int4, 10::pg_catalog.int4)
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_dummy = EXCLUDED.is_dummy, persona_type = EXCLUDED.persona_type;

    -- 2.5 Generate Records
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

    -- 2.6 Update Final Profile State
    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;
    
    -- 2.7 Reset Security Bypass
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '', true);

    RETURN pg_catalog.jsonb_build_object('success'::pg_catalog.text, true::pg_catalog.bool, 'user_id'::pg_catalog.text, v_user_id, 'total_score', v_total_score);
END;
$$;
