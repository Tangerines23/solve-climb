-- ============================================================================
-- game_activity 테이블 보완 마이그레이션
-- ============================================================================
-- 원인: 20251223000002_ranking_v2.sql이 profiles ALTER 등에 의존하여
--       원격 DB에서 실패 시 전체 롤백되어 game_activity가 생성되지 않을 수 있음.
-- 목적: game_activity 테이블이 없을 경우 독립적으로 생성 (멱등)
-- ============================================================================

-- 게임 활동 로그 테이블 생성 (분석용)
CREATE TABLE IF NOT EXISTS public.game_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_activity_user_id ON public.game_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_game_activity_created_at ON public.game_activity(created_at);

-- RLS 설정
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activity" ON public.game_activity;
CREATE POLICY "Users can view own activity" ON public.game_activity FOR SELECT USING (auth.uid() = user_id);
