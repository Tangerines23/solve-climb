-- ============================================================================
-- 디버그 모드 비활성화 스크립트 (프로덕션용)
-- 작성일: 2025.01.01
-- 설명: debug_mode_enabled를 false로 설정합니다
-- ⚠️ 프로덕션 환경에서는 반드시 false로 설정하세요!
-- ============================================================================

-- debug_mode_enabled를 false로 설정
UPDATE public.game_config 
SET 
    value = 'false',
    updated_at = NOW()
WHERE key = 'debug_mode_enabled';

-- 설정이 없으면 추가
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'false', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE 
SET 
    value = 'false',
    updated_at = NOW();

-- 현재 설정 확인
SELECT 
    key,
    value,
    description,
    CASE 
        WHEN value = 'true' THEN '⚠️ 활성화됨 (주의: 프로덕션에서는 위험!)'
        WHEN value = 'false' THEN '✅ 비활성화됨 (안전)'
        ELSE '❓ 알 수 없음'
    END AS status
FROM public.game_config
WHERE key = 'debug_mode_enabled';

