-- ============================================================================
-- 디버그 세션 플래그 추가 마이그레이션
-- 작성일: 2025.01.01
-- ============================================================================

-- game_sessions 테이블에 디버그 세션 플래그 추가
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS is_debug_session BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.game_sessions.is_debug_session IS 
  '디버그 모드로 생성된 세션인지 여부. 무한 스태미나 등 디버그 기능 사용 시 true';

-- 인덱스 추가 (선택, 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_game_sessions_debug 
ON public.game_sessions(is_debug_session) 
WHERE is_debug_session = true;

