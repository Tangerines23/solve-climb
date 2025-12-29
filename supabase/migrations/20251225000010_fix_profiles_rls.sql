-- ============================================================================
-- profiles 테이블 RLS 정책 추가 (406 에러 해결)
-- 작성일: 2025.12.25
-- ============================================================================
-- 문제: profiles 테이블에 RLS가 활성화되어 있지만 SELECT 정책이 없어서 406 에러 발생
-- 해결: 사용자가 자신의 프로필을 조회할 수 있는 정책 추가

-- RLS 활성화 (이미 활성화되어 있어도 안전)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- 정책: 사용자는 자신의 프로필을 조회 가능
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- 정책: 사용자는 자신의 프로필을 수정 가능
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 정책: 모든 사용자가 프로필을 조회 가능 (랭킹 등에서 필요)
-- 주의: 민감한 정보는 제외하고 조회해야 함
CREATE POLICY "Users can view all profiles for ranking" 
  ON public.profiles FOR SELECT 
  USING (true);

