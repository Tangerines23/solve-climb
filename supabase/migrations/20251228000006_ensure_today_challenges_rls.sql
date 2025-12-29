-- ============================================================================
-- today_challenges 테이블 RLS 정책 최종 확인 및 재생성
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 여전히 406 에러 발생
-- 해결: RLS 정책을 완전히 재생성하고 익명 사용자도 명시적으로 허용

-- 1. 모든 정책 삭제
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'today_challenges' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.today_challenges', r.policyname);
    RAISE NOTICE '정책 삭제: %', r.policyname;
  END LOOP;
END $$;

-- 2. RLS 활성화 확인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 생성: USING (true)는 모든 역할에 자동 적용
-- 하지만 명시적으로 익명 사용자도 허용하도록 설정
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 4. 정책 확인
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'today_challenges' AND schemaname = 'public';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '정책 생성 성공! 정책 개수: %', policy_count;
  ELSE
    RAISE EXCEPTION '정책 생성 실패!';
  END IF;
END $$;

