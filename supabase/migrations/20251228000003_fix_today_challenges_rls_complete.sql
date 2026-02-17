-- ============================================================================
-- today_challenges ?�이�?RLS ?�책 ?�전 ?�정 (?�명 ?�용???�근 ?�용)
-- ?�성?? 2025.12.28
-- ============================================================================
-- 문제: ?�명 로그????today_challenges 조회 ??406 ?�러 발생
-- ?�결: ?�책???�전???�생?�하�??�명 ?�용?�도 명시?�으�??�용

-- 1. RLS ?�성???�인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 2. 기존 ?�책 모두 ??�� (?�양???�름???�책???�을 ???�음)
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;
DROP POLICY IF EXISTS "today_challenges_select_policy" ON public.today_challenges;
DROP POLICY IF EXISTS "Public read access" ON public.today_challenges;

-- 3. ?�로???�책 ?�성: 모든 ?�용???�증???�용??+ ?�명 ?�용??+ 비인�??�용??가 ?�기 가??
-- USING (true)??모든 ??��(public, anon, authenticated)???�동?�로 ?�용??
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 4. ?�책 ?�인 (주석 처리)
-- SELECT policyname, cmd, qual, roles FROM pg_policies WHERE tablename = 'today_challenges';

