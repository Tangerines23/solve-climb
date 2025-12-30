-- ============================================================================
-- 디버그 모드 설정 추가 마이그레이션
-- 작성일: 2025.01.01
-- ============================================================================

-- 디버그 모드 활성화 설정 추가 (프로덕션에서는 항상 false)
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'false', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE SET value = 'false';

