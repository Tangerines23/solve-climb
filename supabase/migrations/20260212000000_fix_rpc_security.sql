-- 1. Fix purchase_item RPC to bypass security check
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item_price INTEGER;
    v_user_minerals INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN JSONB_build_object('success', false, 'message', '로그인이 필요합니다.');
    END IF;

    -- Get item price
    SELECT price INTO v_item_price FROM public.items WHERE id = p_item_id;
    IF v_item_price IS NULL THEN
        RETURN JSONB_build_object('success', false, 'message', '존재하지 않는 아이템입니다.');
    END IF;

    -- Lock profile and check minerals
    SELECT minerals INTO v_user_minerals FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    
    -- Fallback: If profile doesn't exist, create one (sync on demand)
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, nickname, minerals)
        VALUES (v_user_id, '신규 등반가', 0)
        RETURNING minerals INTO v_user_minerals;
    END IF;

    IF v_user_minerals < v_item_price THEN
        RETURN JSONB_build_object('success', false, 'message', '미네랄이 부족합니다!');
    END IF;

    -- CRITICAL: Security bypass for mineral deduction
    PERFORM set_config('app.bypass_profile_security', '1', true);

    -- Deduct minerals
    UPDATE public.profiles 
    SET minerals = minerals - v_item_price 
    WHERE id = v_user_id;

    -- Add to inventory
    INSERT INTO public.inventory (user_id, item_id, quantity)
    VALUES (v_user_id, p_item_id, 1)
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = inventory.quantity + 1;

    RETURN JSONB_build_object('success', true, 'message', '구매 완료!');
EXCEPTION WHEN OTHERS THEN
    RETURN JSONB_build_object('success', false, 'message', '오류가 발생했습니다: ' || SQLERRM);
END;
$$;

-- 2. Fix debug_update_profile_stats RPC to bypass security check
CREATE OR REPLACE FUNCTION public.debug_update_profile_stats(
    p_user_id UUID,
    p_stamina INTEGER DEFAULT NULL,
    p_minerals INTEGER DEFAULT NULL,
    p_total_mastery_score INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- CRITICAL: Security bypass for admin updates
    PERFORM set_config('app.bypass_profile_security', '1', true);

    UPDATE public.profiles
    SET 
        stamina = COALESCE(p_stamina, stamina),
        minerals = COALESCE(p_minerals, minerals),
        total_mastery_score = COALESCE(p_total_mastery_score, total_mastery_score),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN JSONB_build_object('success', true, 'message', '프로필 스탯이 업데이트되었습니다.');
END;
$$;

-- 3. Sync missing profiles for ALL existing users to prevent future issues
INSERT INTO public.profiles (id, nickname)
SELECT id, COALESCE(raw_user_meta_data->>'nickname', '신규 등반가')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
