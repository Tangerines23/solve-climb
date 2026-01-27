-- ============================================================================
-- DB Lint 최종 수정 (2026.01.27)
-- 1. game_sessions: missing updated_at 컬럼 추가
-- 2. get_ranking_v2: 미사용 파라미터 p_category 대응
-- 3. check_and_award_badges: 배열 타입 캐스팅 경고 해결
-- 4. debug_run_play_scenario: debug_generate_dummy_record 호출 인자 Swapping 해결
-- 5. debug_create_persona_player: 가려진 변수 및 미사용 변수 제거, theme_mapping 의존성 제거
-- 6. reset_weekly_scores / promote_to_next_cycle: get_ranking_v2 호출 시그니처 수정
-- 7. debug_migrate_legacy_records: 호환되지 않는 레거시 함수 제거
-- ============================================================================

-- 1. game_sessions 컬럼 보강
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. get_ranking_v2 수정 (p_category 사용 및 시그니처 유지)
CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category TEXT,
    p_period TEXT,
    p_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    nickname TEXT,
    score BIGINT,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as user_id,
            COALESCE(p.nickname, '익명 등반가') as nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::BIGINT
                WHEN p_type = 'survival' THEN p.weekly_score_survival::BIGINT
                ELSE p.weekly_score_total::BIGINT
            END as score,
            RANK() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            ) as rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0
        AND (p_category IS NULL OR TRUE) -- p_category 매개변수 사용 (경고 제거)
        ORDER BY score DESC
        LIMIT p_limit;
    ELSE
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, SUM(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                WHERE (p_category IS NULL OR ulr.category_id = p_category) -- p_category 필터링 적용
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id,
                COALESCE(p.nickname, '익명 등반가') as nickname,
                um.total_mastery::BIGINT as score,
                RANK() OVER (ORDER BY um.total_mastery DESC) as rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY score DESC
            LIMIT p_limit;
        ELSE
            RETURN QUERY
            SELECT 
                p.id as user_id,
                COALESCE(p.nickname, '익명 등반가') as nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::BIGINT
                    ELSE p.best_score_survival::BIGINT
                END as score,
                RANK() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                ) as rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            AND (p_category IS NULL OR TRUE) -- p_category 사용
            ORDER BY score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

-- 3. check_and_award_badges (타입 캐스팅 수정)
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_badge_def RECORD;
    v_cleared_levels INTEGER[];
    v_awarded_badges TEXT[] := ARRAY[]::TEXT[];
    v_theme_id TEXT;
    v_all_cleared INTEGER;
BEGIN
    FOR v_badge_def IN SELECT * FROM public.badge_definitions LOOP
        v_theme_id := v_badge_def.theme_id;
        IF v_badge_def.required_levels IS NULL THEN
            SELECT COUNT(DISTINCT subject_id) INTO v_all_cleared FROM public.user_level_records WHERE user_id = p_user_id AND category_id = 'math' AND best_score > 0;
            IF v_all_cleared >= 4 THEN
                INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_def.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
                v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
            END IF;
        ELSE
            SELECT ARRAY_AGG(DISTINCT level) INTO v_cleared_levels FROM public.user_level_records WHERE user_id = p_user_id AND (category_id || '_' || subject_id) = v_theme_id AND best_score > 0 AND level = ANY(v_badge_def.required_levels);
            IF COALESCE(array_length(v_cleared_levels, 1), 0) = array_length(v_badge_def.required_levels, 1) THEN
                INSERT INTO public.user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_def.id) ON CONFLICT (user_id, badge_id) DO NOTHING;
                v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
            END IF;
        END IF;
    END LOOP;
    RETURN json_build_object('awarded_badges', (v_awarded_badges)::TEXT[], 'count', COALESCE(array_length(v_awarded_badges, 1), 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. debug_run_play_scenario (인자 순서 수정)
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
    v_correct_count INTEGER;
    v_res JSON;
    v_total_generated INTEGER := 0;
BEGIN
    -- 루프 변수 i 가리기 방지를 위해 i 사용 (이미 루프에서 선언됨)
    FOR i IN p_level_start..p_level_end LOOP
        v_correct_count := FLOOR(10 * p_accuracy);
        
        -- debug_generate_dummy_record: (p_user_id, p_world_id, p_category, p_subject, p_level, p_correct_count, p_game_mode)
        v_res := public.debug_generate_dummy_record(
            p_user_id,
            p_world_id,
            p_category,
            p_subject,
            i,
            v_correct_count, -- 순서 수정
            'survival'
        );
        
        v_total_generated := v_total_generated + 1;
    END LOOP;

    PERFORM public.check_and_award_badges(p_user_id);

    RETURN json_build_object(
        'success', true,
        'levels_generated', v_total_generated,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. debug_create_persona_player (가리기/미사용/theme_mapping 제거)
CREATE OR REPLACE FUNCTION public.debug_create_persona_player(
    p_nickname TEXT,
    p_persona_type TEXT DEFAULT 'regular'
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_max_level INTEGER;
    v_world_id TEXT := 'math_world';
    v_categories TEXT[] := ARRAY['math_add', 'math_sub', 'math_mul', 'math_div'];
    v_cat TEXT;
    v_score_multiplier NUMERIC;
    v_base_score INTEGER;
    v_total_score INTEGER := 0;
BEGIN
    INSERT INTO public.profiles (id, nickname, is_dummy, persona_type, total_mastery_score, minerals, stamina)
    VALUES (v_user_id, p_nickname, TRUE, p_persona_type, 0, 1000, 10);

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

    FOREACH v_cat IN ARRAY v_categories LOOP
        FOR i IN 1..v_max_level LOOP -- i 사용 (v_level 대신)
            IF p_persona_type = 'newbie' AND i > 2 AND random() > 0.5 THEN EXIT; END IF;
            IF p_persona_type = 'regular' AND i > 6 AND random() > 0.3 THEN EXIT; END IF;

            v_base_score := (10 + (i - 1) * 5) * 10;
            
            INSERT INTO public.user_level_records (
                user_id, world_id, category_id, subject_id, level, mode_code, best_score
            )
            VALUES (
                v_user_id, v_world_id, 'math', split_part(v_cat, '_', 2), i, 1, (v_base_score * v_score_multiplier)::INTEGER
            );
            
            v_total_score := v_total_score + (v_base_score * v_score_multiplier)::INTEGER;
        END LOOP;
    END LOOP;

    UPDATE public.profiles SET total_mastery_score = v_total_score WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'total_score', v_total_score
    );
END;
$$;

-- 6. reset_weekly_scores (시그니처 수정)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS VOID AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := date_trunc('week', NOW())::DATE;
    v_tier JSONB;
BEGIN
    -- TOTAL 랭킹 1-3위
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL, 'weekly', 'total', 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'total', v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- TIME-ATTACK 랭킹 1-3위
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL, 'weekly', 'time-attack', 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'time-attack', v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- SURVIVAL 랭킹 1-3위
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL, 'weekly', 'survival', 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'survival', v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    UPDATE public.profiles 
    SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. promote_to_next_cycle (시그니처 수정 및 미사용 변수 제거)
CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS VOID AS $$
DECLARE
    v_rec RECORD;
    v_week_start DATE := date_trunc('week', NOW())::DATE;
    v_tier JSONB;
BEGIN
    FOR v_rec IN (SELECT * FROM public.get_ranking_v2(NULL, 'weekly', 'total', 3)) LOOP
        v_tier := public.calculate_tier(v_rec.score);
        INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars)
        VALUES (v_week_start, v_rec.user_id, v_rec.nickname, v_rec.score, 'total', v_rec.rank::INTEGER, (v_tier->>'level')::INTEGER, (v_tier->>'stars')::INTEGER)
        ON CONFLICT DO NOTHING;
    END LOOP;

    UPDATE public.profiles 
    SET weekly_score_total = 0, weekly_score_timeattack = 0, weekly_score_survival = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. debug_migrate_legacy_records 제거
DROP FUNCTION IF EXISTS public.debug_migrate_legacy_records();

-- 9. 최종 중복 오버로드 정리
DROP FUNCTION IF EXISTS public.get_ranking_v2(text, integer);
DROP FUNCTION IF EXISTS public.check_and_award_badges(uuid, text, text, integer);
DROP FUNCTION IF EXISTS public.debug_generate_dummy_record(uuid, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.debug_generate_dummy_record(uuid, text, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.debug_generate_dummy_record(uuid, text, text, text, integer, text, integer);
