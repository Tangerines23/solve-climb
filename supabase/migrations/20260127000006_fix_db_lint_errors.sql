-- ============================================================================
-- DB Lint 에러 수정 및 함수 고도화 (2026.01.27)
-- 1. check_and_award_badges: theme_mapping 의존성 제거 및 문자열 기반 매칭으로 수정
-- 2. recover_stamina_ads: 미사용 변수 제거
-- 3. debug_run_play_scenario: 변수 가리기(Shadowing) 문제 해결
-- ============================================================================

-- 1. check_and_award_badges 수정
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_badge_def RECORD;
    v_cleared_levels INTEGER[];
    v_awarded_badges TEXT[] := '{}';
    v_theme_id TEXT;
    v_all_cleared INTEGER;
BEGIN
    FOR v_badge_def IN SELECT * FROM public.badge_definitions LOOP
        v_theme_id := v_badge_def.theme_id;

        -- 1. 카테고리 전체 클리어 (필수 레벨 목록이 없는 경우)
        IF v_badge_def.required_levels IS NULL THEN
            -- 예: 'math' 카테고리 내의 모든 레벨이 최소 1개라도 점수가 있는지 확인
            SELECT COUNT(DISTINCT subject_id) INTO v_all_cleared
            FROM public.user_level_records
            WHERE user_id = p_user_id 
              AND category_id = 'math' 
              AND best_score > 0;

            -- 4개 주제(add, sub, mul, div) 모두 클리어 시
            IF v_all_cleared >= 4 THEN
                INSERT INTO public.user_badges (user_id, badge_id)
                VALUES (p_user_id, v_badge_def.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
            END IF;
            
        -- 2. 특정 테마/레벨 클리어 (필수 레벨 목록이 있는 경우)
        ELSE
            -- theme_mapping 조인 제거하고 category_id/subject_id 기반으로 직접 확인
            SELECT ARRAY_AGG(DISTINCT level) INTO v_cleared_levels
            FROM public.user_level_records
            WHERE user_id = p_user_id
              AND (category_id || '_' || subject_id) = v_theme_id
              AND best_score > 0
              AND level = ANY(v_badge_def.required_levels);

            -- 모든 필수 레벨이 클리어되었는지 확인
            IF array_length(v_cleared_levels, 1) = array_length(v_badge_def.required_levels, 1) THEN
                INSERT INTO public.user_badges (user_id, badge_id)
                VALUES (p_user_id, v_badge_def.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'awarded_badges', v_awarded_badges, 
        'count', COALESCE(array_length(v_awarded_badges, 1), 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. recover_stamina_ads 수정 (미사용 v_current_stamina 제거)
CREATE OR REPLACE FUNCTION public.recover_stamina_ads()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_last_recharge TIMESTAMPTZ;
    v_cooldown_hours CONSTANT INTEGER := 6;
    v_max_stamina CONSTANT INTEGER := 5;
BEGIN
    v_user_id := auth.uid();
    
    -- Lock row (v_current_stamina 제거)
    SELECT last_ad_stamina_recharge 
    INTO v_last_recharge
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    -- 1. 쿨타임 체크
    IF v_last_recharge IS NOT NULL AND (NOW() - v_last_recharge) < (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', '아직 충전할 수 없습니다.', 
            'remaining_minutes', CEIL(EXTRACT(EPOCH FROM ((v_last_recharge + (v_cooldown_hours * INTERVAL '1 hour')) - NOW())) / 60)
        );
    END IF;

    -- 2. 풀 충전 (5)
    UPDATE public.profiles
    SET stamina = v_max_stamina,
        last_ad_stamina_recharge = NOW(),
        last_stamina_update = NOW()
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'stamina', v_max_stamina,
        'message', '산소통이 가득 채워졌습니다! 🫧'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. debug_run_play_scenario 수정 (v_level 중복 선언 제거)
CREATE OR REPLACE FUNCTION public.debug_run_play_scenario(
    p_user_id UUID,
    p_world_id TEXT,
    p_category TEXT,
    p_subject TEXT,
    p_level_start INTEGER,
    p_level_end INTEGER,
    p_accuracy NUMERIC DEFAULT 0.8
)
RETURNS JSON AS $$
DECLARE
    -- v_level 삭제 (FOR 루프에서 자동 생성됨)
    v_correct_count INTEGER;
    v_res JSON;
    v_total_generated INTEGER := 0;
BEGIN
    FOR i IN p_level_start..p_level_end LOOP
        v_correct_count := FLOOR(10 * p_accuracy);
        
        v_res := public.debug_generate_dummy_record(
            p_user_id,
            p_world_id,
            p_category,
            p_subject,
            i, -- i 사용
            'survival',
            v_correct_count
        );
        
        v_total_generated := v_total_generated + 1;
    END LOOP;

    -- 뱃지 체크
    PERFORM public.check_and_award_badges(p_user_id);

    RETURN json_build_object(
        'success', true,
        'levels_generated', v_total_generated,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. debug_generate_dummy_record 수정 (theme_mapping 제거 및 string ID 대응)
CREATE OR REPLACE FUNCTION public.debug_generate_dummy_record(
    p_user_id UUID,
    p_world_id TEXT,
    p_category TEXT,
    p_subject TEXT,
    p_level INTEGER,
    p_correct_count INTEGER,
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

    v_calculated_score := FLOOR(p_correct_count * v_base_level_score * v_theme_multiplier);
    
    IF p_level = 10 THEN
        v_calculated_score := v_calculated_score + FLOOR(p_correct_count * 5.0);
    END IF;

    -- 2. 매핑 정보 조회 (theme_mapping 제거, mode_mapping은 유지)
    SELECT code INTO v_mode_code FROM public.mode_mapping WHERE mode_id = p_game_mode;

    IF v_mode_code IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid mode');
    END IF;

    -- 3. 레코드 기록 (string ID 기반으로 변경)
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
