-- ============================================================================
-- 랭킹 시스템 고도화: 명예의 전당 (Hall of Fame) 및 시즌 초기화 로직 개선
-- ============================================================================

-- 1. 명예의 전당 테이블 생성
CREATE TABLE IF NOT EXISTS public.hall_of_fame (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL, -- 해당 주차의 시작일 (보통 지난주 월요일)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    score BIGINT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('total', 'time-attack', 'survival')),
    rank INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- 한 주차에 같은 모드, 같은 등수는 중복될 수 없음 (1~3위까지만 저장하므로)
    -- 단, 동점자 처리를 위해 유저 단위 유니크 제약 조건을 검토해야 함
    UNIQUE(week_start_date, mode, user_id)
);

-- RLS 설정 (누구나 조회 가능, 쓰기는 서버만)
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hall of fame" 
ON public.hall_of_fame FOR SELECT 
USING (true);

-- 2. reset_weekly_scores 함수 수정 (스냅샷 저장 후 초기화)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_week_start DATE := CURRENT_DATE - INTERVAL '7 days'; -- 지난주 시작일 (오늘이 초기화일인 월요일 가정)
BEGIN
    -- (1) 명예의 전당 스냅샷 저장 (각 모드별 상위 3명)
    
    -- 1-1. 종합 랭킹 (Total)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '익명 등반가'), 
        weekly_score_total, 
        'total',
        RANK() OVER (ORDER BY weekly_score_total DESC)
    FROM public.profiles
    WHERE weekly_score_total > 0
    ORDER BY weekly_score_total DESC
    LIMIT 3;

    -- 1-2. 타임어택 (Time Attack)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '익명 등반가'), 
        weekly_score_timeattack, 
        'time-attack',
        RANK() OVER (ORDER BY weekly_score_timeattack DESC)
    FROM public.profiles
    WHERE weekly_score_timeattack > 0
    ORDER BY weekly_score_timeattack DESC
    LIMIT 3;

    -- 1-3. 서바이벌 (Survival)
    INSERT INTO public.hall_of_fame (week_start_date, user_id, nickname, score, mode, rank)
    SELECT 
        v_week_start,
        id, 
        COALESCE(nickname, '익명 등반가'), 
        weekly_score_survival, 
        'survival',
        RANK() OVER (ORDER BY weekly_score_survival DESC)
    FROM public.profiles
    WHERE weekly_score_survival > 0
    ORDER BY weekly_score_survival DESC
    LIMIT 3;

    -- (2) 점수 초기화
    UPDATE public.profiles 
    SET 
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0;
        
END;
$$;
