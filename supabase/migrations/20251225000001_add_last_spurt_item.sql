-- 라스트 스퍼트 아이템 추가
-- 타임어택 전용 부활 아이템: 시간 0초 시 +15초 추가 + 5초 피버

INSERT INTO public.items (id, code, name, price, description, category)
VALUES 
  (202, 'last_spurt', '라스트 스퍼트', 800, '시간 0초 시 +15초 추가 + 5초 피버', 'trigger')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

