-- ============================================================================
-- 디버그 모드 활성화 스크립트
-- 작성일: 2025.01.01
-- 설명: debug_mode_enabled를 true로 설정합니다 (개발 환경용)
-- ⚠️ 주의: 프로덕션 환경에서는 false로 설정해야 합니다!
-- ============================================================================

-- debug_mode_enabled를 true로 설정
UPDATE public.game_config 
SET 
    value = 'true',
    updated_at = NOW()
WHERE key = 'debug_mode_enabled';

-- 설정이 없으면 추가
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'true', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE 
SET 
    value = 'true',
    updated_at = NOW();

-- 현재 설정 확인
SELECT 
    key,
    value,
    description,
    CASE 
        WHEN value = 'true' THEN '✅ 활성화됨 (디버그 함수 사용 가능)'
        WHEN value = 'false' THEN '❌ 비활성화됨 (디버그 함수 사용 불가)'
        ELSE '❓ 알 수 없음'
    END AS status
FROM public.game_config
WHERE key = 'debug_mode_enabled';

