-- ============================================================================
-- ?�버�??�션 ?�래�?추�? 마이그레?�션
-- ?�성?? 2025.01.01
-- ============================================================================

-- game_sessions ?�이블에 ?�버�??�션 ?�래�?추�?
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS is_debug_session BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.game_sessions.is_debug_session IS 
  '?�버�?모드�??�성???�션?��? ?��?. 무한 ?�태미나 ???�버�?기능 ?�용 ??true';

-- ?�덱??추�? (?�택, ?�능 최적??
CREATE INDEX IF NOT EXISTS idx_game_sessions_debug 
ON public.game_sessions(is_debug_session) 
WHERE is_debug_session = true;

