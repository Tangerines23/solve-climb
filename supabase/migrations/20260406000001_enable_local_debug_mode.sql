-- ============================================================================
-- 디버그 모드 활성화 (로컬 개발용)
-- 작성일: 2026.04.06
-- 목적: debug_mode_enabled 설정을 true로 변경하여 디버그 RPC 사용 허용
-- ============================================================================

INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'true', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE 
SET 
    value = 'true',
    updated_at = NOW();
