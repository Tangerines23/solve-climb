-- ============================================================================
-- today_challenges 테이블 RLS 정책 수정 (익명 사용자 접근 허용)
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 익명 로그인 시 today_challenges 조회 시 406 에러 발생
-- 해결: 익명 사용자도 명시적으로 허용하는 정책으로 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;

-- 새로운 정책: 모든 사용자(인증된 사용자 + 익명 사용자)가 읽기 가능
-- 익명 사용자도 auth.uid()가 null이 아니므로 USING (true)로 충분
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 정책이 제대로 생성되었는지 확인
-- SELECT * FROM pg_policies WHERE tablename = 'today_challenges';

