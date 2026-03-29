-- [NEW] [fix_debug_rpcs.sql]
-- This migration adds the missing debug_reset_inventory function and ensures common debug RPCs are robust.

-- 1. debug_reset_inventory 함수 추가
CREATE OR REPLACE FUNCTION public.debug_reset_inventory(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.inventory
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. debug_set_inventory_quantity 함수 견고성 강화 (upsert 로직)
DROP FUNCTION IF EXISTS public.debug_set_inventory_quantity(UUID, INT, INT);
CREATE OR REPLACE FUNCTION public.debug_set_inventory_quantity(
    p_user_id UUID,
    p_item_id INT,
    p_quantity INT
)
RETURNS VOID AS $$
BEGIN
    IF p_quantity <= 0 THEN
        DELETE FROM public.inventory
        WHERE user_id = p_user_id AND item_id = p_item_id;
    ELSE
        INSERT INTO public.inventory (user_id, item_id, quantity)
        VALUES (p_user_id, p_item_id, p_quantity)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 권한 설정
GRANT EXECUTE ON FUNCTION public.debug_reset_inventory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_reset_inventory(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.debug_set_inventory_quantity(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_inventory_quantity(UUID, INT, INT) TO service_role;

COMMENT ON FUNCTION public.debug_reset_inventory IS '인벤토리를 초기화합니다. (디버그 전용)';
COMMENT ON FUNCTION public.debug_set_inventory_quantity IS '아이템 수량을 강제로 설정합니다. (디버그 전용)';
