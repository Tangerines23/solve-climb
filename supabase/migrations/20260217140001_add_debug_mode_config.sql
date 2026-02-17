-- ============================================================================
-- ?�버�?모드 ?�정 추�? 마이그레?�션
-- ?�성?? 2025.01.01
-- ============================================================================

-- ?�버�?모드 ?�성???�정 추�? (?�로?�션?�서????�� false)
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'false', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE SET value = 'false';

