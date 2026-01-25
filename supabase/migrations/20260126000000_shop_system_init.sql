-- ============================================================================
-- 상점 아이템 시스템 초기화
-- 작성일: 2026.01.26
-- ============================================================================

-- 1. items 테이블 생성
CREATE TABLE IF NOT EXISTS public.items (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. inventory 테이블 생성
CREATE TABLE IF NOT EXISTS public.inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- RLS 활성화
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 정책 설정
DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.items;
CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT USING (auth.uid() = user_id);

-- 3. initial items seeding
INSERT INTO public.items (id, code, name, price, description, category)
VALUES 
  (1, 'oxygen_tank', '산소통', 500, '제한 시간 +10초', 'time'),
  (2, 'power_gel', '파워젤', 300, '시작 시 모멘텀(콤보1) 활성', 'buff'),
  (3, 'safety_rope', '안전 로프', 1000, '오답 1회 방어', 'defense'),
  (4, 'flare', '구조 신호탄', 1500, '게임 오버 시 부활', 'revive'),
  (202, 'last_spurt', '라스트 스퍼트', 800, '시간 0초 시 +15초 추가 + 5초 피버', 'trigger')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- 4. purchase_item RPC 함수 구현
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_item_price INTEGER;
    v_user_minerals INTEGER;
BEGIN
    -- 1. 로그인 확인
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', '로그인이 필요합니다.');
    END IF;

    -- 2. 아이템 가격 확인
    SELECT price INTO v_item_price FROM public.items WHERE id = p_item_id;
    IF v_item_price IS NULL THEN
        RETURN json_build_object('success', false, 'message', '존재하지 않는 아이템입니다.');
    END IF;

    -- 3. 유저 미네랄 확인
    SELECT minerals INTO v_user_minerals FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_user_minerals < v_item_price THEN
        RETURN json_build_object('success', false, 'message', '미네랄이 부족합니다!');
    END IF;

    -- 4. 미네랄 차감
    UPDATE public.profiles 
    SET minerals = minerals - v_item_price 
    WHERE id = v_user_id;

    -- 5. 인벤토리 추가
    INSERT INTO public.inventory (user_id, item_id, quantity)
    VALUES (v_user_id, p_item_id, 1)
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = inventory.quantity + 1;

    RETURN json_build_object('success', true, 'message', '구매 완료!');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', '오류가 발생했습니다: ' || SQLERRM);
END;
$$;
