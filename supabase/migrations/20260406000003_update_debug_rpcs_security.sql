-- Migration: Update Debug RPCs with Security Bypass
-- Date: 2026-04-06
-- Description: Adds 'app.bypass_profile_security' to debug RPCs that update the profiles table.

-- 1. debug_update_profile_stats 업데이트
CREATE OR REPLACE FUNCTION public.debug_update_profile_stats(
    p_user_id uuid,
    p_stamina integer DEFAULT NULL,
    p_minerals integer DEFAULT NULL,
    p_total_mastery_score integer DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RETURN jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production');
    END IF;

    -- 보안 트리거 우회 설정
    PERFORM set_config('app.bypass_profile_security', '1', true);

    UPDATE public.profiles
    SET 
        stamina = COALESCE(p_stamina, stamina),
        minerals = COALESCE(p_minerals, minerals),
        total_mastery_score = COALESCE(p_total_mastery_score, total_mastery_score),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile stats updated successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$function$;

-- 2. debug_set_mastery_score 업데이트
CREATE OR REPLACE FUNCTION public.debug_set_mastery_score(p_user_id uuid, p_score integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RETURN jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production');
  END IF;
  
  IF v_authenticated_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  IF p_user_id != v_authenticated_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permission denied');
  END IF;
  
  -- 보안 트리거 우회 설정
  PERFORM set_config('app.bypass_profile_security', '1', true);

  UPDATE public.profiles
  SET total_mastery_score = p_score,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  PERFORM public.update_user_tier(p_user_id);
  
  RETURN jsonb_build_object('success', true, 'message', 'Mastery score updated to ' || p_score);
END;
$function$;

-- 3. debug_set_tier 업데이트
CREATE OR REPLACE FUNCTION public.debug_set_tier(p_user_id uuid, p_level integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RETURN jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production');
  END IF;
  
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permission denied');
  END IF;
  
  -- 보안 트리거 우회 설정
  PERFORM set_config('app.bypass_profile_security', '1', true);

  UPDATE public.profiles
  SET current_tier_level = p_level,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Tier updated to level ' || p_level);
END;
$function$;

-- 4. debug_reset_profile 업데이트
CREATE OR REPLACE FUNCTION public.debug_reset_profile(p_user_id uuid, p_reset_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RETURN jsonb_build_object('success', false, 'message', 'Debug functions are disabled in production');
  END IF;
  
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permission denied');
  END IF;
  
  -- 보안 트리거 우회 설정
  PERFORM set_config('app.bypass_profile_security', '1', true);

  CASE p_reset_type
    WHEN 'all' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          minerals = 0,
          stamina = 5,
          updated_at = NOW()
      WHERE id = p_user_id;
      
      DELETE FROM public.inventory WHERE user_id = p_user_id;
      DELETE FROM public.user_level_records WHERE user_id = p_user_id;
      DELETE FROM public.user_badges WHERE user_id = p_user_id;
      
    WHEN 'score' THEN
      UPDATE public.profiles
      SET total_mastery_score = 0,
          current_tier_level = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
      DELETE FROM public.user_level_records WHERE user_id = p_user_id;
    WHEN 'minerals' THEN
      UPDATE public.profiles
      SET minerals = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    WHEN 'tier' THEN
      UPDATE public.profiles
      SET current_tier_level = 0,
          updated_at = NOW()
      WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Invalid reset type: %', p_reset_type;
  END CASE;
  
  RETURN jsonb_build_object('success', true, 'message', 'Profile reset complete: ' || p_reset_type);
END;
$function$;

-- 5. debug_create_persona_player 업데이트 (파라미터 기본값 유지)
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(p_nickname text, p_persona_type text DEFAULT 'regular'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_max_level INTEGER;
    v_world_id TEXT := 'math_world';
    v_score_multiplier NUMERIC;
    v_base_score INTEGER;
    v_total_score INTEGER := 0;
    v_theme_code SMALLINT;
    v_mode_code SMALLINT := 1; 
    v_theme_id TEXT;
BEGIN
    IF NOT COALESCE((SELECT value::BOOLEAN FROM public.game_config WHERE key = 'debug_mode_enabled'), false) THEN
        RETURN JSONB_build_object('success', false, 'message', 'Debug functions are disabled in production');
    END IF;

    -- 보안 트리거 우회 설정
    PERFORM set_config('app.bypass_profile_security', '1', true);

    -- Insert into auth.users first to satisfy Foreign Key constraint (profiles.id -> auth.users.id)
    -- We use placeholder values that mark this as a dummy/authenticated user
    INSERT INTO auth.users (
        id, 
        instance_id, 
        email, 
        raw_user_meta_data, 
        created_at, 
        updated_at, 
        aud, 
        role, 
        is_sso_user, 
        is_anonymous
    )
    VALUES (
        v_user_id, 
        '00000000-0000-0000-0000-000000000000', 
        'dummy_' || v_user_id::text || '@solve-climb.local', 
        '{"is_dummy": true}'::jsonb, 
        NOW(), 
        NOW(), 
        'authenticated', 
        'authenticated', 
        FALSE, 
        FALSE
    );

    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0, 1000, 10);

    INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions)
    VALUES (v_user_id, 10, 80, 100);

    IF p_persona_type = 'newbie' THEN
        v_max_level := 3;
        v_score_multiplier := 0.7;
    ELSIF p_persona_type = 'regular' THEN
        v_max_level := 8;
        v_score_multiplier := 1.0;
    ELSE
        v_max_level := 15;
        v_score_multiplier := 1.5;
    END IF;

    FOR v_theme_id IN SELECT unnest(ARRAY['math_add', 'math_sub', 'math_mul', 'math_div']) LOOP
        SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
        
        IF v_theme_code IS NOT NULL THEN
            FOR i IN 1..v_max_level LOOP
                IF p_persona_type = 'newbie' AND i > 2 AND random() > 0.5 THEN EXIT; END IF;
                IF p_persona_type = 'regular' AND i > 6 AND random() > 0.3 THEN EXIT; END IF;

                v_base_score := (10 + (i - 1) * 5) * 10;
                
                INSERT INTO public.user_level_records (
                    user_id, world_id, category_id, subject_id, level, mode_code, theme_code, best_score
                )
                VALUES (
                    v_user_id, v_world_id, split_part(v_theme_id, '_', 1), split_part(v_theme_id, '_', 2), i, v_mode_code, v_theme_code, (v_base_score * v_score_multiplier)::INTEGER
                )
                ON CONFLICT (user_id, theme_code, level, mode_code) DO NOTHING;
                
                v_total_score := v_total_score + (v_base_score * v_score_multiplier)::INTEGER;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'total_score', v_total_score, 'message', 'Dummy player created and synced successfully');
END;
$function$;

-- 더미 프로필 선택을 허용하는 RLS 정책 추가 (디버그 모드 전용)
DROP POLICY IF EXISTS "Allow selecting dummy profiles in debug mode" ON public.profiles;
CREATE POLICY "Allow selecting dummy profiles in debug mode"
ON public.profiles
FOR SELECT
TO authenticated, anon
USING (
    is_dummy = true AND 
    EXISTS (
        SELECT 1 FROM public.game_config 
        WHERE key = 'debug_mode_enabled' AND value = 'true'
    )
);

-- 더미 플레이어 일괄 삭제 함수 (보안 강화)
CREATE OR REPLACE FUNCTION public.debug_delete_all_dummies()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_is_debug_enabled boolean;
    v_dummy_count integer;
BEGIN
    SELECT COALESCE((value::boolean), false) INTO v_is_debug_enabled
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';

    IF NOT v_is_debug_enabled THEN
        RETURN json_build_object('success', false, 'error', 'Debug mode is not enabled');
    END IF;

    -- 삭제될 더미 수 계산
    SELECT count(*) INTO v_dummy_count FROM public.profiles WHERE is_dummy = true;

    -- auth.users에서 삭제하면 profiles 및 하위 테이블(inventory, records 등)이 자동 연쇄 삭제(Cascade)됨
    DELETE FROM auth.users 
    WHERE id IN (SELECT id FROM public.profiles WHERE is_dummy = true);

    -- 혹시나 auth.users와 연결되지 않은 더미 프로필이 있을 경우를 대비해 마무리 삭제
    DELETE FROM public.profiles WHERE is_dummy = true;

    RETURN json_build_object('success', true, 'deleted_count', v_dummy_count);
END;
$function$;
