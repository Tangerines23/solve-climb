-- ============================================================================
-- today_challenges 테이블 RLS 정책 수정 (anon 역할 명시적 허용)
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 익명 사용자(anon 역할)가 접근하지 못함
-- 해결: anon 역할도 명시적으로 허용하는 정책 추가

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;

-- 새로운 정책: USING (true)는 모든 역할(public, anon, authenticated)에 자동 적용됨
-- Supabase에서는 TO 절이 무시되므로 USING (true)만 사용
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 정책 확인
-- SELECT policyname, cmd, qual, roles FROM pg_policies WHERE tablename = 'today_challenges';

