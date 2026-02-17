-- ============================================================================
-- profiles ?�이�?RLS ?�책 추�? (406 ?�러 ?�결)
-- ?�성?? 2025.12.25
-- ============================================================================
-- 문제: profiles ?�이블에 RLS가 ?�성?�되???��?�?SELECT ?�책???�어??406 ?�러 발생
-- ?�결: ?�용?��? ?�신???�로?�을 조회?????�는 ?�책 추�?

-- RLS ?�성??(?��? ?�성?�되???�어???�전)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 기존 ?�책 ??�� (?�다�?
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- ?�책: ?�용?�는 ?�신???�로?�을 조회 가??
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- ?�책: ?�용?�는 ?�신???�로?�을 ?�정 가??
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ?�책: 모든 ?�용?��? ?�로?�을 조회 가??(??�� ?�에???�요)
-- 주의: 민감???�보???�외?�고 조회?�야 ??
CREATE POLICY "Users can view all profiles for ranking" 
  ON public.profiles FOR SELECT 
  USING (true);

