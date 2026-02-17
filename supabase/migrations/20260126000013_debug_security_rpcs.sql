-- ============================================================================
-- ?�버�??�용: 보안 강화 RPC ?�수
-- ============================================================================

-- 1. ?�로???�탯 강제 ?�정 (?�테미나, 미네?? 마스?�리 ?�수 ??
CREATE OR REPLACE FUNCTION public.debug_update_profile_stats(
    p_user_id UUID,
    p_stamina INTEGER DEFAULT NULL,
    p_minerals INTEGER DEFAULT NULL,
    p_total_mastery_score INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한 ?�행
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        stamina = COALESCE(p_stamina, stamina),
        minerals = COALESCE(p_minerals, minerals),
        total_mastery_score = COALESCE(p_total_mastery_score, total_mastery_score),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN JSONB_build_object(
        'success', true,
        'message', '?�로???�탯???�데?�트?�었?�니??'
    );
END;
$$;

-- 2. ?�벤?�리 ?�량 강제 ?�정
CREATE OR REPLACE FUNCTION public.debug_set_inventory_quantity(
    p_user_id UUID,
    p_item_id INTEGER,
    p_quantity INTEGER
)
RETURNS JSONB
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

    RETURN JSONB_build_object(
        'success', true,
        'message', '?�벤?�리 ?�량??조정?�었?�니??'
    );
END;
$$;
