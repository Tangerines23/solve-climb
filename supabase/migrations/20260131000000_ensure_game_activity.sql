-- ============================================================================
-- game_activity ?�이�?보완 마이그레?�션
-- ============================================================================
-- ?�인: 20251223000002_ranking_v2.sql??profiles ALTER ?�에 ?�존?�여
--       ?�격 DB?�서 ?�패 ???�체 롤백?�어 game_activity가 ?�성?��? ?�을 ???�음.
-- 목적: game_activity ?�이블이 ?�을 경우 ?�립?�으�??�성 (멱등)
-- ============================================================================

-- 게임 ?�동 로그 ?�이�??�성 (분석??
CREATE TABLE IF NOT EXISTS public.game_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ?�덱???�성
CREATE INDEX IF NOT EXISTS idx_game_activity_user_id ON public.game_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_game_activity_created_at ON public.game_activity(created_at);

-- RLS ?�정
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activity" ON public.game_activity;
CREATE POLICY "Users can view own activity" ON public.game_activity FOR SELECT USING (auth.uid() = user_id);
