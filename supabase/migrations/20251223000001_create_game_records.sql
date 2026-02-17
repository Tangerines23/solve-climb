-- ============================================================================
-- 게임 기록 �??�벨 진행???�?�을 ?�한 ?�이�?
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

    -- ?�일 ?��?가 같�? 카테고리/주제/?�벨/모드???�???�나???�코?�만 가지?�록 ?�약
    CONSTRAINT unique_game_record UNIQUE (user_id, category, subject, level, mode)
);

-- ?�덱???�성 (조회 ?�능 최적??
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON public.game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_category_mode_score ON public.game_records(category, mode, score DESC);

-- RLS (Row Level Security) ?�정
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;

-- ?�책 1: 본인??기록�?조회 가??
DROP POLICY IF EXISTS "Users can view own game records" ON public.game_records;
CREATE POLICY "Users can view own game records" ON public.game_records
    FOR SELECT USING (auth.uid() = user_id);

-- ?�책 2: 본인??기록�??�입 가??
DROP POLICY IF EXISTS "Users can insert own game records" ON public.game_records;
CREATE POLICY "Users can insert own game records" ON public.game_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ?�책 3: 본인??기록�??�정 가??
DROP POLICY IF EXISTS "Users can update own game records" ON public.game_records;
CREATE POLICY "Users can update own game records" ON public.game_records
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 글로벌 ??�� 조회�??�한 RPC ?�수
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
        -- ?��?�??�당 카테고리/모드??총점 계산 (?�벨�?최고?�의 ??
        SELECT 
            gr.user_id,
            SUM(gr.score) as total_score
        FROM public.game_records gr
        WHERE gr.category = p_category AND gr.mode = p_mode
        GROUP BY gr.user_id
    )
    SELECT 
        us.user_id,
        COALESCE(p.nickname, '?�명 ?�반가') as nickname,
        us.total_score,
        RANK() OVER (ORDER BY us.total_score DESC) as rank
    FROM user_scores us
    LEFT JOIN public.profiles p ON us.user_id = p.id
    ORDER BY us.total_score DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_ranking IS '?�정 카테고리?� 모드?�서 ?��?�?최고 ?�수???�계�?기�??�로 ??��??반환?�니??';
