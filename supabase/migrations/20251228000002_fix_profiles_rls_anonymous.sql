-- ============================================================================
-- profiles 테이블 RLS 정책 수정 (익명 사용자 접근 허용)
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 익명 로그인 시 profiles 조회 시 406 에러 발생 가능
-- 해결: 익명 사용자도 랭킹 조회는 가능하도록 명시적으로 허용

-- 기존 정책 확인 및 유지
-- "Users can view own profile": auth.uid() = id (자신의 프로필만)
-- "Users can update own profile": auth.uid() = id (자신의 프로필만)
-- "Users can view all profiles for ranking": true (모든 프로필 조회 가능)

-- 랭킹 조회 정책이 이미 USING (true)로 설정되어 있으므로
-- 익명 사용자도 접근 가능해야 합니다.
-- 하지만 정책이 제대로 적용되지 않았을 수 있으므로 재생성

-- 랭킹 조회 정책 재생성 (익명 사용자 명시적 허용)
DROP POLICY IF EXISTS "Users can view all profiles for ranking" ON public.profiles;
CREATE POLICY "Users can view all profiles for ranking" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- 정책 확인 쿼리 (주석 처리)
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

