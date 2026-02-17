-- ============================================================================
-- 명예???�당 ?�어 박제 (?�구 보존) 로직
-- ============================================================================

-- 1. hall_of_fame ?�이블에 ?�어 ?�보 컬럼 추�?
ALTER TABLE public.hall_of_fame ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 0;
ALTER TABLE public.hall_of_fame ADD COLUMN IF NOT EXISTS tier_stars INTEGER DEFAULT 0;

-- 2. reset_weekly_scores ?�수 고도??(?�어 ?�보 계산 �??�??
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
    -- (1) 명예???�당 ?�냅???�??(�?모드�??�위 3�?
    
    -- 루프�??�며 �???��???�재 글로벌 ?�어 ?�보�?박제?�니??
    -- 종합 ?�수 기�??�로 ?�어�?결정?��?�?profiles??total_mastery_score ?�용
    FOR v_rec IN (
        -- �?모드�??�위 3명을 ??번에 추출
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
        -- ?�당 ?��????�재 ?�어 계산
        v_tier := public.calculate_tier(v_rec.total_mastery_score);

        INSERT INTO public.hall_of_fame (
            week_start_date, user_id, nickname, score, mode, rank, tier_level, tier_stars
        )
        VALUES (
            v_week_start,
            v_rec.user_id,
            COALESCE(v_rec.nickname, '?�명 ?�반가'),
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

    -- (2) 주간 ?�수 초기??
    UPDATE public.profiles 
    SET 
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0;
        
END;
$$;
