-- ============================================================================
-- 디버그 전용: 보안 강화 RPC 함수
-- ============================================================================

-- 1. 프로필 스탯 강제 설정 (스테미나, 미네랄, 마스터리 점수 등)
CREATE OR REPLACE FUNCTION public.debug_update_profile_stats(
    p_user_id UUID,
    p_stamina INTEGER DEFAULT NULL,
    p_minerals INTEGER DEFAULT NULL,
    p_total_mastery_score INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한 실행
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        stamina = COALESCE(p_stamina, stamina),
        minerals = COALESCE(p_minerals, minerals),
        total_mastery_score = COALESCE(p_total_mastery_score, total_mastery_score),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', '프로필 스탯이 업데이트되었습니다.'
    );
END;
$$;

-- 2. 인벤토리 수량 강제 설정
CREATE OR REPLACE FUNCTION public.debug_set_inventory_quantity(
    p_user_id UUID,
    p_item_id INTEGER,
    p_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_quantity <= 0 THEN
        DELETE FROM public.inventory
        WHERE user_id = p_user_id AND item_id = p_item_id;
    ELSE
        INSERT INTO public.inventory (user_id, item_id, quantity)
        VALUES (p_user_id, p_item_id, p_quantity)
        ON CONFLICT (user_id, item_id) 
        DO UPDATE SET quantity = EXCLUDED.quantity;
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', '인벤토리 수량이 조정되었습니다.'
    );
END;
$$;
