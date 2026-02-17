-- ============================================================================
-- ??�� ?�스??고도?? 명예???�당 (Hall of Fame) �??�즌 초기??로직 개선
-- ============================================================================

-- 1. 명예???�당 ?�이�??�성
CREATE TABLE IF NOT EXISTS public.hall_of_fame (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL, -- ?�당 주차???�작??(보통 지?�주 ?�요??
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    score BIGINT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('total', 'time-attack', 'survival')),
    rank INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- ??주차??같�? 모드, 같�? ?�수??중복?????�음 (1~3?�까지�??�?�하므�?
    -- ?? ?�점??처리�??�해 ?��? ?�위 ?�니???�약 조건??검?�해????
    UNIQUE(week_start_date, mode, user_id)
);

-- RLS ?�정 (?�구??조회 가?? ?�기???�버�?
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hall of fame" 
ON public.hall_of_fame FOR SELECT 
USING (true);

-- 2. reset_weekly_scores ?�수 ?�정 (?�냅???�????초기??
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_start DATE := CURRENT_DATE - INTERVAL '7 days'; -- 지?�주 ?�작??(?�늘??초기?�일???�요??가??
BEGIN
    -- (1) 명예???�당 ?�냅???�??(�?모드�??�위 3�?
    
    -- 1-1. 종합 ??�� (Total)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '?�명 ?�반가'), 
        weekly_score_total, 
        'total',
        RANK() OVER (ORDER BY weekly_score_total DESC)
    FROM public.profiles
    WHERE weekly_score_total > 0
    ORDER BY weekly_score_total DESC
    LIMIT 3;

    -- 1-2. ?�?�어??(Time Attack)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '?�명 ?�반가'), 
        weekly_score_timeattack, 
        'time-attack',
        RANK() OVER (ORDER BY weekly_score_timeattack DESC)
    FROM public.profiles
    WHERE weekly_score_timeattack > 0
    ORDER BY weekly_score_timeattack DESC
    LIMIT 3;

    -- 1-3. ?�바?�벌 (Survival)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '?�명 ?�반가'), 
        weekly_score_survival, 
        'survival',
        RANK() OVER (ORDER BY weekly_score_survival DESC)
    FROM public.profiles
    WHERE weekly_score_survival > 0
    ORDER BY weekly_score_survival DESC
    LIMIT 3;

    -- (2) ?�수 초기??
    UPDATE public.profiles 
    SET 
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0;
        
END;
$$;
