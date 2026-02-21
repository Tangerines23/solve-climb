-- ============================================================================
-- debug_generate_dummy_record: ON CONFLICT 절 수정
-- 날짜: 2026.02.21
-- 목적: ON CONFLICT 대상 컬럼을 유니크 인덱스(idx_user_level_records_final_unique)와 일치시킴
--        기존: (user_id, category_id, subject_id, level, mode_code, world_id) ← 6컬럼
--        수정: (user_id, category_id, subject_id, level, mode_code)           ← 5컬럼
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
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- 2. 매핑 정보 조회
    SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

    IF v_mode_code IS NULL THEN
        RETURN JSONB_build_object('success', false, 'error', 'Invalid mode');
    END IF;

    -- 3. 레코드 기록 (ON CONFLICT를 유니크 인덱스와 일치시킴)
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
    ON CONFLICT (user_id, category_id, subject_id, level, mode_code)
    DO UPDATE SET 
        best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
        world_id = EXCLUDED.world_id,
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

    RETURN JSONB_build_object(
        'success', true,
        'calculated_score', v_calculated_score,
        'score_diff', v_score_diff,
        'message', '더미 레코드가 생성 및 반영되었습니다'
    );
END;
$$;
