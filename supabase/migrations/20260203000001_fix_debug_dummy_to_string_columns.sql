-- ============================================================================
-- debug_generate_dummy_record 수정: category_id/subject_id/world_id 기반으로 변경
-- 작성일: 2026.02.03
-- 목적: user_level_records가 theme_code 대신 category_id/subject_id/world_id를 사용하므로 함수 수정
-- ============================================================================

-- ============================================================================
-- 1. debug_generate_dummy_record 7인자 버전 (category_id/subject_id/world_id 기반)
--    시그니처: (uuid, text, text, text, integer, integer, text)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.debug_generate_dummy_record(
    p_user_id UUID,
    p_world_id TEXT,
    p_category TEXT,
    p_subject TEXT,
    p_level INTEGER,
    p_correct_count INTEGER,
    p_game_mode TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_base_level_score INTEGER;
    v_theme_multiplier NUMERIC := 1.5;
    v_calculated_score INTEGER;
    v_theme_id TEXT;
    v_mode_code SMALLINT;
    v_old_best INTEGER;
    v_score_diff INTEGER;
BEGIN
    -- 1. 기본 점수 및 배율 계산
    v_base_level_score := 10 + (p_level - 1) * 5;
    v_theme_id := p_category || '_' || p_subject;
    
    IF v_theme_id IN ('math_arithmetic', 'language_japanese') THEN 
        v_theme_multiplier := 1.0; 
    END IF;

    -- 기본 점수 계산
    v_calculated_score := FLOOR(p_correct_count * v_base_level_score * v_theme_multiplier);
    
    -- 보너스 (Boss Level 10)
    IF p_level = 10 THEN
        v_calculated_score := v_calculated_score + FLOOR(p_correct_count * 5.0);
    END IF;

    -- 2. 매핑 정보 조회 (theme_mapping 제거, mode_mapping은 유지)
    SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

    IF v_mode_code IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid mode');
    END IF;

    -- 3. 레코드 기록 (string ID 기반 - category_id/subject_id/world_id)
    SELECT best_score INTO v_old_best 
    FROM public.user_level_records 
    WHERE user_id = p_user_id 
      AND category_id = p_category 
      AND subject_id = p_subject 
      AND level = p_level 
      AND mode_code = v_mode_code;

    INSERT INTO public.user_level_records (
        user_id, category_id, subject_id, world_id, level, mode_code, best_score
    )
    VALUES (
        p_user_id, p_category, p_subject, p_world_id, p_level, v_mode_code, v_calculated_score
    )
    ON CONFLICT (user_id, category_id, subject_id, level, mode_code, world_id)
    DO UPDATE SET 
        best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
        updated_at = NOW();

    -- 4. 프로필 업데이트
    v_score_diff := GREATEST(0, v_calculated_score - COALESCE(v_old_best, 0));
    
    IF v_score_diff > 0 THEN
        UPDATE public.profiles
        SET 
            total_mastery_score = total_mastery_score + v_score_diff,
            weekly_score_total = weekly_score_total + v_score_diff,
            weekly_score_timeattack = CASE WHEN p_game_mode = 'timeattack' THEN weekly_score_timeattack + v_score_diff ELSE weekly_score_timeattack END,
            weekly_score_survival = CASE WHEN p_game_mode = 'survival' THEN weekly_score_survival + v_score_diff ELSE weekly_score_survival END,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'calculated_score', v_calculated_score,
        'score_diff', v_score_diff,
        'message', '더미 레코드가 생성 및 반영되었습니다.'
    );
END;
$$;

-- ============================================================================
-- 2. debug_generate_dummy_record 6인자 버전 (래퍼)
--    시그니처: (uuid, text, text, integer, integer, text)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.debug_generate_dummy_record(
    p_user_id UUID,
    p_category TEXT,
    p_subject TEXT,
    p_level INTEGER,
    p_correct_count INTEGER,
    p_game_mode TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_world_id TEXT;
BEGIN
    -- world_id를 p_category || '_' || p_subject로 설정 (7인자 버전 호출)
    v_world_id := p_category || '_' || p_subject;
    
    RETURN public.debug_generate_dummy_record(
        p_user_id,
        v_world_id,
        p_category,
        p_subject,
        p_level,
        p_correct_count,
        p_game_mode
    );
END;
$$;

-- ============================================================================
-- 3. search_path 보안 강화
-- ============================================================================
ALTER FUNCTION public.debug_generate_dummy_record(uuid, text, text, text, integer, integer, text) SET search_path = public;
ALTER FUNCTION public.debug_generate_dummy_record(uuid, text, text, integer, integer, text) SET search_path = public;
