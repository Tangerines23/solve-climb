-- ============================================================================
-- 통합 뱃지 수여 시스템 (보안 강화 버전)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_award_badges(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_altitude BIGINT;
    v_streak INTEGER;
    v_awarded_badges TEXT[] := ARRAY[]::TEXT[];
    v_badge_id TEXT;
    v_record RECORD;
BEGIN
    -- 1. 유저 기초 통계 조회
    SELECT total_mastery_score, login_streak 
    INTO v_total_altitude, v_streak
    FROM public.profiles
    WHERE id = p_user_id;

    -- 2. 고도 기반 뱃지 (Growth)
    FOR v_badge_id IN SELECT unnest(ARRAY['altitude_1', 'altitude_100', 'altitude_1000', 'altitude_8848', 'altitude_space']) LOOP
        IF (v_badge_id = 'altitude_1' AND v_total_altitude >= 1) OR
           (v_badge_id = 'altitude_100' AND v_total_altitude >= 100) OR
           (v_badge_id = 'altitude_1000' AND v_total_altitude >= 1000) OR
           (v_badge_id = 'altitude_8848' AND v_total_altitude >= 8848) OR
           (v_badge_id = 'altitude_space' AND v_total_altitude >= 100000) 
        THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (p_user_id, v_badge_id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            IF FOUND THEN
                v_awarded_badges := array_append(v_awarded_badges, v_badge_id);
            END IF;
        END IF;
    END LOOP;

    -- 3. 스트릭 기반 뱃지 (Persistence)
    FOR v_badge_id IN SELECT unnest(ARRAY['streak_3', 'streak_7']) LOOP
        IF (v_badge_id = 'streak_3' AND v_streak >= 3) OR
           (v_badge_id = 'streak_7' AND v_streak >= 7)
        THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (p_user_id, v_badge_id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            IF FOUND THEN
                v_awarded_badges := array_append(v_awarded_badges, v_badge_id);
            END IF;
        END IF;
    END LOOP;

    -- 4. 숙련도 기반 뱃지 (Mastery)
    -- 사칙연산의 신 (arithmetic 15레벨 달성)
    IF EXISTS (
        SELECT 1 FROM public.user_level_records ulr
        JOIN public.theme_mapping tm ON ulr.theme_code = tm.code
        WHERE ulr.user_id = p_user_id 
          AND tm.theme_id LIKE '%arithmetic%' 
          AND ulr.level >= 15 
          AND ulr.best_score > 0
    ) THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (p_user_id, 'master_arithmetic_god')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        
        IF FOUND THEN
            v_awarded_badges := array_append(v_awarded_badges, 'master_arithmetic_god');
        END IF;
    END IF;

    -- 5. 정확도 마스터 (Skill) - 최근 10게임 평균 90% 이상
    -- 세션 데이터 기반으로 계산 (복잡하므로 추후 확장 가능, 여기서는 일단 뼈대만 유지)

    RETURN json_build_object(
        'success', true,
        'awarded_badges', v_awarded_badges,
        'count', array_length(v_awarded_badges, 1)
    );
END;
$$;
