-- ============================================================================
-- 게임 기록 및 레벨 진행도 저장을 위한 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    level INTEGER NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    cleared BOOLEAN DEFAULT false,
    cleared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- 동일 유저가 같은 카테고리/주제/레벨/모드에 대해 하나의 레코드만 가지도록 제약
    CONSTRAINT unique_game_record UNIQUE (user_id, category, subject, level, mode)
);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON public.game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_category_mode_score ON public.game_records(category, mode, score DESC);

-- RLS (Row Level Security) 설정
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인의 기록만 조회 가능
DROP POLICY IF EXISTS "Users can view own game records" ON public.game_records;
CREATE POLICY "Users can view own game records" ON public.game_records
    FOR SELECT USING (auth.uid() = user_id);

-- 정책 2: 본인의 기록만 삽입 가능
DROP POLICY IF EXISTS "Users can insert own game records" ON public.game_records;
CREATE POLICY "Users can insert own game records" ON public.game_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 정책 3: 본인의 기록만 수정 가능
DROP POLICY IF EXISTS "Users can update own game records" ON public.game_records;
CREATE POLICY "Users can update own game records" ON public.game_records
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 글로벌 랭킹 조회를 위한 RPC 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_ranking(
    p_category TEXT,
    p_mode TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    nickname TEXT,
    total_score BIGINT,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_scores AS (
        -- 유저별 해당 카테고리/모드의 총점 계산 (레벨별 최고점의 합)
        SELECT 
            gr.user_id,
            SUM(gr.score) as total_score
        FROM public.game_records gr
        WHERE gr.category = p_category AND gr.mode = p_mode
        GROUP BY gr.user_id
    )
    SELECT 
        us.user_id,
        COALESCE(p.nickname, '익명 등반가') as nickname,
        us.total_score,
        RANK() OVER (ORDER BY us.total_score DESC) as rank
    FROM user_scores us
    LEFT JOIN public.profiles p ON us.user_id = p.id
    ORDER BY us.total_score DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_ranking IS '특정 카테고리와 모드에서 유저별 최고 점수의 합계를 기준으로 랭킹을 반환합니다.';
