-- ============================================================================
-- theme_mapping 테이블 및 debug_generate_dummy_record 함수 보장
-- 작성일: 2026.02.03
-- 목적: CI lint 실패 해소 - theme_mapping 부재 및 debug_generate_dummy_record 오버로드 부재 수정
-- ============================================================================

-- ============================================================================
-- 1. theme_mapping 테이블 보장
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.theme_mapping (
  code SMALLINT PRIMARY KEY,
  theme_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

-- 초기 데이터 (20251225000002_tier_system_schema.sql 기준)
INSERT INTO public.theme_mapping (code, theme_id, name) VALUES
(1, 'math_add', '수학 덧셈'),
(2, 'math_sub', '수학 뺄셈'),
(3, 'math_mul', '수학 곱셈'),
(4, 'math_div', '수학 나눗셈'),
(5, 'eng_word', '영어 단어'),
(6, 'logic_puzzle', '논리 퍼즐')
ON CONFLICT (code) DO NOTHING;

-- 추가 테마 (20251225000009_fix_mapping_tables.sql 기준)
INSERT INTO public.theme_mapping (code, theme_id, name) VALUES
(7, 'math_arithmetic', '수학 사칙연산'),
(8, 'math_equations', '수학 방정식')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. debug_generate_dummy_record 7인자 버전
--    시그니처: (uuid, text, text, text, integer, integer, text)
--    역할: debug_run_play_scenario 7인자 버전에서 호출
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
    v_theme_code SMALLINT;
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

    -- 2. 매핑 정보 조회 (theme_mapping + theme_code 기반)
    SELECT code INTO v_theme_code FROM public.theme_mapping WHERE theme_id = v_theme_id;
    SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

    IF v_theme_code IS NULL OR v_mode_code IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid theme or mode');
    END IF;

    -- 3. 레코드 기록 (theme_code 기반)
    SELECT best_score INTO v_old_best 
    FROM public.user_level_records 
    WHERE user_id = p_user_id 
      AND theme_code = v_theme_code 
      AND level = p_level 
      AND mode_code = v_mode_code;

    INSERT INTO public.user_level_records (user_id, theme_code, level, mode_code, best_score)
    VALUES (p_user_id, v_theme_code, p_level, v_mode_code, v_calculated_score)
    ON CONFLICT (user_id, theme_code, level, mode_code)
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
-- 3. debug_generate_dummy_record 6인자 버전 (래퍼)
--    시그니처: (uuid, text, text, integer, integer, text)
--    역할: debug_run_play_scenario 9인자 버전에서 호출
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
-- 4. search_path 보안 강화 (20260128000002_harden_search_path.sql 패턴)
-- ============================================================================
ALTER FUNCTION public.debug_generate_dummy_record(uuid, text, text, text, integer, integer, text) SET search_path = public;
ALTER FUNCTION public.debug_generate_dummy_record(uuid, text, text, integer, integer, text) SET search_path = public;
