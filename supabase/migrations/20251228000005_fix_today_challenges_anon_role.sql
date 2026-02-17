-- ============================================================================
-- today_challenges ?�이�?RLS ?�책 ?�정 (anon ??�� 명시???�용)
-- ?�성?? 2025.12.28
-- ============================================================================
-- 문제: ?�명 ?�용??anon ??��)가 ?�근?��? 못함
-- ?�결: anon ??��??명시?�으�??�용?�는 ?�책 추�?

-- 기존 ?�책 ??��
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;

-- ?�로???�책: USING (true)??모든 ??��(public, anon, authenticated)???�동 ?�용??
-- Supabase?�서??TO ?�이 무시?��?�?USING (true)�??�용
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- ?�책 ?�인
-- SELECT policyname, cmd, qual, roles FROM pg_policies WHERE tablename = 'today_challenges';

