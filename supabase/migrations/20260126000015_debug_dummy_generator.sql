-- ============================================================================
-- 디버그 전용: 시뮬레이션 기반 레코드 생성 시스템
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debug_generate_dummy_record(
    p_user_id UUID,
    p_category TEXT,
    p_subject TEXT,
    p_level INTEGER,
    p_correct_count INTEGER, -- 0~10
    p_game_mode TEXT DEFAULT 'timeattack'
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
    v_theme_code SMALLINT;
    v_mode_code SMALLINT;
    v_old_best INTEGER;
    v_score_diff INTEGER;
BEGIN
    -- 1. 기본 점수 및 배율 계산 (submit_game_result 로직 복제)
    v_base_level_score := 10 + (p_level - 1) * 5;
    v_theme_id := p_category || '_' || p_subject;
    
    IF v_theme_id IN ('math_arithmetic', 'language_japanese') THEN 
        v_theme_multiplier := 1.0; 
    END IF;

    -- 기본 점수 계산
    v_calculated_score := FLOOR(p_correct_count * v_base_level_score * v_theme_multiplier);
    
    -- 보너스 (Boss Level 10)
    IF p_level = 10 THEN
        v_calculated_score := v_calculated_score + FLOOR(p_correct_count * 5.0); -- 10문제 기준 50점 보너스
    END IF;

    -- 2. 매핑 정보 조회
    SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
    SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

    IF v_theme_code IS NULL OR v_mode_code IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid theme or mode');
    END IF;

    -- 3. 레코드 기록 (User Level Records)
    SELECT best_score INTO v_old_best 
    FROM public.user_level_records 
    WHERE user_id = p_user_id AND theme_code = v_theme_code AND level = p_level AND mode_code = v_mode_code;

    INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score)
    VALUES (p_user_id, v_theme_code, p_level, v_mode_code, v_calculated_score)
    ON CONFLICT (user_id, theme_code, level, mode_code)
    DO UPDATE SET 
        best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
        updated_at = NOW();

    -- 4. 프로필 업데이트 (주간 점수 및 마스터리 점수 반영)
    -- 실제 submit_game_result와 유사하게 작동하도록 diff 계산
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
