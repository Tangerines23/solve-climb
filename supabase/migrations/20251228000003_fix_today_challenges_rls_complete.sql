-- ============================================================================
-- today_challenges 테이블 RLS 정책 완전 수정 (익명 사용자 접근 허용)
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 익명 로그인 시 today_challenges 조회 시 406 에러 발생
-- 해결: 정책을 완전히 재생성하고 익명 사용자도 명시적으로 허용

-- 1. RLS 활성화 확인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 모두 삭제 (다양한 이름의 정책이 있을 수 있음)
DROP POLICY IF EXISTS "Anyone can read today challenges" ON public.today_challenges;
DROP POLICY IF EXISTS "today_challenges_select_policy" ON public.today_challenges;
DROP POLICY IF EXISTS "Public read access" ON public.today_challenges;

-- 3. 새로운 정책 생성: 모든 사용자(인증된 사용자 + 익명 사용자 + 비인증 사용자)가 읽기 가능
-- USING (true)는 모든 역할(public, anon, authenticated)에 자동으로 적용됨
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 4. 정책 확인 (주석 처리)
-- SELECT policyname, cmd, qual, roles FROM pg_policies WHERE tablename = 'today_challenges';

