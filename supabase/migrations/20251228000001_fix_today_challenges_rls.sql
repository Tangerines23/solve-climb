-- ============================================================================
-- today_challenges ?�이�?RLS ?�책 ?�정 (?�명 ?�용???�근 ?�용)
-- ?�성?? 2025.12.28
-- ============================================================================
-- 문제: ?�명 로그????today_challenges 조회 ??406 ?�러 발생
-- ?�결: ?�명 ?�용?�도 명시?�으�??�용?�는 ?�책?�로 ?�정

-- 기존 ?�책 ??��
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;

-- ?�로???�책: 모든 ?�용???�증???�용??+ ?�명 ?�용??가 ?�기 가??
-- ?�명 ?�용?�도 auth.uid()가 null???�니므�?USING (true)�?충분
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- ?�책???��?�??�성?�었?��? ?�인
-- SELECT * FROM pg_policies WHERE tablename = 'today_challenges';

