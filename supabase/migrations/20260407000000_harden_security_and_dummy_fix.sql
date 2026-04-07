-- [CONSOLIDATED] Database Security Hardening and Dummy Creation Fix
-- Date: 2026-04-07

-- 1. DROP ALL INSECURE/LEGACY VERSIONS OF SD FUNCTIONS
DROP FUNCTION IF EXISTS public.add_minerals(integer) CASCADE;
DROP FUNCTION IF EXISTS public.consume_item(integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_id_by_toss_key(text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_set_stamina(integer) CASCADE;
DROP FUNCTION IF EXISTS public.debug_set_minerals(integer) CASCADE;
DROP FUNCTION IF EXISTS public.migrate_existing_records() CASCADE;
DROP FUNCTION IF EXISTS public.user_exists_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_set_inventory_quantity(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.debug_reset_inventory(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.debug_grant_badge(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_remove_badge(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_seed_badge_definitions(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.recover_stamina_ads() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_recover_stamina() CASCADE;
DROP FUNCTION IF EXISTS public.debug_generate_dummy_record(uuid, text, text, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_generate_dummy_record(uuid, text, text, text, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_ranking_v2(text, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_user_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.find_user_by_toss_key(text) CASCADE;
DROP FUNCTION IF EXISTS public.consume_stamina() CASCADE;
DROP FUNCTION IF EXISTS public.create_game_session(jsonb, text, text, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_game_session(jsonb, text, text, integer, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.debug_set_mastery_score(uuid, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_ranking(text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.handle_daily_login() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_nickname(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_game_session(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.debug_delete_dummy_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.debug_reset_level_progress(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.debug_run_play_scenario(uuid, text, text, integer, integer, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.purchase_item(integer) CASCADE;

-- 2. HARDENED SD FUNCTIONS WITH SET search_path = ''

-- 2.1 debug_create_persona_player
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
    v_mode_code SMALLINT := 1; 
    v_theme_id TEXT;
BEGIN
    IF NOT COALESCE((SELECT (value = 'true')::BOOLEAN FROM public.game_config WHERE key = 'debug_mode_enabled'), false) THEN
        RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Debug functions are disabled in production'::text);
    END IF;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, aud, role, is_sso_user, is_anonymous, created_at, updated_at)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dummy_' || pg_catalog.replace(v_user_id::text, '-', '') || '@solve-climb.local', 
            pg_catalog.jsonb_build_object('is_dummy'::text, true::boolean, 'nickname'::text, p_nickname::text), 'authenticated', 'authenticated', FALSE, FALSE, pg_catalog.now(), pg_catalog.now());

    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0, 1000, 10)
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_dummy = EXCLUDED.is_dummy, persona_type = EXCLUDED.persona_type, total_mastery_score = EXCLUDED.total_mastery_score, minerals = EXCLUDED.minerals, stamina = EXCLUDED.stamina;

    INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions)
    VALUES (v_user_id, 10, 80, 100) ON CONFLICT (id) DO NOTHING;

    IF p_persona_type = 'newbie' THEN v_max_level := 3; v_score_multiplier := 0.7; ELSIF p_persona_type = 'regular' THEN v_max_level := 8; v_score_multiplier := 1.0; ELSE v_max_level := 15; v_score_multiplier := 1.5; END IF;

    FOR v_theme_id IN SELECT pg_catalog.unnest(ARRAY['math_add', 'math_sub', 'math_mul', 'math_div']::text[]) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..v_max_level LOOP
                IF p_persona_type = 'newbie' AND i > 2 AND pg_catalog.random() > 0.5 THEN EXIT; END IF;
                IF p_persona_type = 'regular' AND i > 6 AND pg_catalog.random() > 0.3 THEN EXIT; END IF;
                v_base_score := (10 + (i - 1) * 5) * 10;
                INSERT INTO public.user_level_records (user_id, world_id, category_id, subject_id, level, mode_code, theme_code, best_score)
                VALUES (v_user_id, v_world_id, pg_catalog.split_part(v_theme_id, '_', 1), pg_catalog.split_part(v_theme_id, '_', 2), i, v_mode_code, v_theme_code, (v_base_score * v_score_multiplier)::INTEGER)
                ON CONFLICT (user_id, theme_code, level, mode_code) DO NOTHING;
                v_total_score := v_total_score + (v_base_score * v_score_multiplier)::INTEGER;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;

    RETURN pg_catalog.jsonb_build_object('success'::text, true::boolean, 'user_id'::text, v_user_id::uuid, 'total_score'::text, v_total_score::integer, 'message'::text, 'Dummy player created and synced successfully'::text);
END;
$function$;

-- 2.2 debug_delete_all_dummies
CREATE OR REPLACE FUNCTION public.debug_delete_all_dummies()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NOT COALESCE((SELECT (value::boolean) FROM public.game_config WHERE key = 'debug_mode_enabled'), false) THEN
        RETURN pg_catalog.json_build_object('success'::text, false::boolean, 'error'::text, 'Debug mode is not enabled'::text);
    END IF;

    DELETE FROM auth.users WHERE id IN (SELECT id FROM public.profiles WHERE is_dummy = true);
    DELETE FROM public.profiles WHERE is_dummy = true;

    RETURN pg_catalog.json_build_object('success'::text, true::boolean);
END;
$function$;

-- 2.3 submit_game_result
CREATE OR REPLACE FUNCTION public.submit_game_result(p_user_answers jsonb, p_question_ids jsonb, p_game_mode text, p_items_used integer[], p_session_id uuid, p_category text, p_subject text, p_level integer, p_avg_solve_time double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_debug_session BOOLEAN;
  v_calculated_score INTEGER;
  v_earned_minerals INTEGER;
BEGIN
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
  SELECT is_debug_session INTO v_is_debug_session FROM public.game_sessions WHERE id = p_session_id AND user_id = v_user_id;
  v_calculated_score := 100 * p_level; 
  UPDATE public.game_sessions SET status = 'completed', score = v_calculated_score WHERE id = p_session_id;
  IF NOT COALESCE(v_is_debug_session, false) THEN UPDATE public.profiles SET stamina = pg_catalog.greatest(0, stamina - 1), last_game_submit_at = pg_catalog.now() WHERE id = v_user_id; ELSE UPDATE public.profiles SET last_game_submit_at = pg_catalog.now() WHERE id = v_user_id; END IF;
  v_earned_minerals := pg_catalog.least(pg_catalog.floor(v_calculated_score / 100), 10000);
  UPDATE public.profiles SET minerals = minerals + v_earned_minerals WHERE id = v_user_id;
  RETURN pg_catalog.jsonb_build_object('success'::text, true::boolean, 'earned_minerals'::text, v_earned_minerals::integer, 'calculated_score'::text, v_calculated_score::integer);
END;
$function$;

-- 2.4 purchase_item
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id uuid, p_quantity integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_item_price INTEGER;
    v_user_minerals INTEGER;
BEGIN
    IF v_user_id IS NULL THEN RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Not authenticated'::text); END IF;
    SELECT price INTO v_item_price FROM public.items WHERE id = p_item_id;
    IF v_item_price IS NULL THEN RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Item not found'::text); END IF;
    SELECT minerals INTO v_user_minerals FROM public.profiles WHERE id = v_user_id;
    IF v_user_minerals < (v_item_price * p_quantity) THEN RETURN pg_catalog.jsonb_build_object('success'::text, false::boolean, 'message'::text, 'Insufficient minerals'::text); END IF;
    PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);
    UPDATE public.profiles SET minerals = minerals - (v_item_price * p_quantity), updated_at = pg_catalog.now() WHERE id = v_user_id;
    INSERT INTO public.inventory (user_id, item_id, quantity) VALUES (v_user_id, p_item_id, p_quantity) ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = inventory.quantity + p_quantity;
    INSERT INTO public.security_audit_log (user_id, event_type, event_data) VALUES (v_user_id, 'item_purchased', pg_catalog.jsonb_build_object('item_id'::text, p_item_id::uuid, 'quantity'::text, p_quantity::integer));
    RETURN pg_catalog.jsonb_build_object('success'::text, true::boolean, 'message'::text, 'Purchase successful'::text);
END;
$function$;

-- 2.5 check_profile_update_security (Trigger logic)
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF (pg_catalog.current_setting('app.bypass_profile_security', true) = '1') THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'Profiles can only be updated via secure RPC functions';
END;
$function$;

DROP TRIGGER IF EXISTS tr_check_profile_update_security ON public.profiles;
CREATE TRIGGER tr_check_profile_update_security BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_profile_update_security();

-- 3. RLS SECURITY TIGHTENING

-- Tighten all sensitive tables to authenticated only
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Define strict TO authenticated policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" ON public.user_level_records FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Partition RLS
DO $$
BEGIN
    FOR j IN 0..9 LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records_' || j;
        EXECUTE 'CREATE POLICY "Users can view own records" ON public.user_level_records_' || j || 
                ' FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    END LOOP;
END;
$$;
