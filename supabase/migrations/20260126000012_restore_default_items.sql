-- ============================================================================
-- 상점 시스템 기본 아이템 복구 RPC 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_default_items()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행
AS $$
DECLARE
    v_item RECORD;
    v_count INTEGER := 0;
BEGIN
    -- 기본 아이템 목록 정의 및 UPSERT
    -- ID를 명시하여 기존 아이템과의 호환성을 유지합니다
    
    -- 1. 산소통
    INSERT INTO public.items (id, code, name, price, description, category)
    VALUES (1, 'oxygen_tank', '산소통', 500, '제한 시간 +10초', 'time')
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
    v_count := v_count + 1;

    -- 2. 파워젤
    INSERT INTO public.items (id, code, name, price, description, category)
    VALUES (2, 'power_gel', '파워젤', 300, '시작 시 모멘텀(콤보1) 활성', 'buff')
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
    v_count := v_count + 1;

    -- 3. 안전 로프
    INSERT INTO public.items (id, code, name, price, description, category)
    VALUES (3, 'safety_rope', '안전 로프', 1000, '오답 1회 방어', 'defense')
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
    v_count := v_count + 1;

    -- 4. 구조 신호탄
    INSERT INTO public.items (id, code, name, price, description, category)
    VALUES (4, 'flare', '구조 신호탄', 1500, '게임 오버 시 부활', 'revive')
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
    v_count := v_count + 1;

    -- 202. 라스트 스퍼트
    INSERT INTO public.items (id, code, name, price, description, category)
    VALUES (202, 'last_spurt', '라스트 스퍼트', 800, '시간 0초 시 +15초 추가 + 5초 피버', 'trigger')
    ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
    v_count := v_count + 1;

    RETURN JSONB_build_object(
        'success', true,
        'restored_count', v_count,
        'message', '상점 기본 아이템이 성공적으로 복구/업데이트되었습니다'
    );
END;
$$;
