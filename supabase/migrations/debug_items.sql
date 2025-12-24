-- debug_grant_items RPC 생성 SQL
-- 이 함수는 RLS(Row Level Security)를 우회하여 강제로 아이템을 지급합니다.
-- Supabase SQL Editor에서 실행해주세요.

CREATE OR REPLACE FUNCTION debug_grant_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- RLS 우회 권한
AS $$
DECLARE
    v_user_id UUID;
    v_item_code TEXT;
    v_item_id BIGINT;
    v_items TEXT[] := ARRAY['safety_rope', 'flare', 'oxygen_tank', 'power_gel'];
BEGIN
    v_user_id := auth.uid();
    
    FOREACH v_item_code IN ARRAY v_items
    LOOP
        -- 1. 아이템 ID 조회
        SELECT id INTO v_item_id FROM public.items WHERE code = v_item_code;
        
        IF v_item_id IS NOT NULL THEN
            -- 2. 인벤토리 추가 또는 갱신 (Upsert)
            INSERT INTO public.inventory (user_id, item_id, quantity)
            VALUES (v_user_id, v_item_id, 5)
            ON CONFLICT (user_id, item_id)
            DO UPDATE SET quantity = inventory.quantity + 5;
        END IF;
    END LOOP;
END;
$$;
