-- 1. items 테이블 보완 (없을 경우 생성)
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

-- 2. RLS 활성화 및 권한 설정
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.items;
CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING (true);

-- 3. 필수 아이템 강제 삽입/업데이트
-- 이 작업은 기존 아이템이 있더라도 최신 메타데이터로 갱신합니다
INSERT INTO public.items (id, code, name, price, description, category)
VALUES 
  (1, 'oxygen_tank', '산소통', 500, '제한 시간 +10초', 'time'),
  (2, 'power_gel', '파워젤', 300, '시작 시 모멘텀(콤보1) 활성', 'buff'),
  (3, 'safety_rope', '안전 로프', 1000, '오답 1회 방어', 'defense'),
  (4, 'flare', '구조 신호탄', 1500, '게임 오버 시 부활', 'revive'),
  (202, 'last_spurt', '라스트 스퍼트', 800, '시간 0초 시 +15초 추가 + 5초 피버', 'trigger')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- 4. 인벤토리 정책 확인 (안전장치)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" ON public.inventory FOR SELECT USING (auth.uid() = user_id);
