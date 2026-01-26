-- ============================================================================
-- 명예의 전당 티어 박제 (영구 보존) 로직
-- ============================================================================

-- 1. hall_of_fame 테이블에 티어 정보 컬럼 추가
ALTER TABLE public.hall_of_fame ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 0;
ALTER TABLE public.hall_of_fame ADD COLUMN IF NOT EXISTS tier_stars INTEGER DEFAULT 0;

-- 2. reset_weekly_scores 함수 고도화 (티어 정보 계산 및 저장)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_start DATE := CURRENT_DATE - INTERVAL '7 days';
    v_rec RECORD;
    v_tier JSON;
BEGIN
    -- (1) 명예의 전당 스냅샷 저장 (각 모드별 상위 3명)
    
    -- 루프를 돌며 각 랭커의 현재 글로벌 티어 정보를 박제합니다.
    -- 종합 점수 기준으로 티어를 결정하므로 profiles의 total_mastery_score 사용
    FOR v_rec IN (
        -- 각 모드별 상위 3명을 한 번에 추출
        WITH top_rankers AS (
            SELECT 
                p.id as user_id, 
                p.nickname, 
                p.weekly_score_total as score, 
                p.total_mastery_score,
                'total' as mode,
                RANK() OVER (ORDER BY p.weekly_score_total DESC) as rank
            FROM public.profiles p WHERE p.weekly_score_total > 0
            UNION ALL
            SELECT 
                p.id as user_id, 
                p.nickname, 
                p.weekly_score_timeattack as score, 
                p.total_mastery_score,
                'time-attack' as mode,
                RANK() OVER (ORDER BY p.weekly_score_timeattack DESC) as rank
            FROM public.profiles p WHERE p.weekly_score_timeattack > 0
            UNION ALL
            SELECT 
                p.id as user_id, 
                p.nickname, 
                p.weekly_score_survival as score, 
                p.total_mastery_score,
                'survival' as mode,
                RANK() OVER (ORDER BY p.weekly_score_survival DESC) as rank
            FROM public.profiles p WHERE p.weekly_score_survival > 0
        )
        SELECT * FROM top_rankers WHERE rank <= 3
    ) LOOP
        -- 해당 유저의 현재 티어 계산
        v_tier := public.calculate_tier(v_rec.total_mastery_score);

        INSERT INTO public.hall_of_fame (
            week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars
        )
        VALUES (
            v_week_start,
            v_rec.user_id,
            COALESCE(v_rec.nickname, '익명 등반가'),
            v_rec.score,
            v_rec.mode,
            v_rec.rank,
            (v_tier->>'level')::INTEGER,
            (v_tier->>'stars')::INTEGER
        )
        ON CONFLICT (week_start_date, mode, user_id) DO UPDATE
        SET 
            score = EXCLUDED.score, 
            rank = EXCLUDED.rank,
            tier_level = EXCLUDED.tier_level,
            tier_stars = EXCLUDED.tier_stars;
    END LOOP;

    -- (2) 주간 점수 초기화
    UPDATE public.profiles 
    SET 
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0;
        
END;
$$;
