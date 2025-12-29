-- ============================================================================
-- today_challenges 테이블 RLS 정책 확인 및 강제 재생성
-- 작성일: 2025.12.28
-- ============================================================================
-- 문제: 정책이 제대로 생성되지 않았을 수 있음
-- 해결: 정책을 완전히 삭제하고 재생성

-- 1. 현재 정책 확인
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'today_challenges' AND schemaname = 'public';
  
  RAISE NOTICE '현재 today_challenges 정책 개수: %', policy_count;
END $$;

-- 2. 모든 정책 삭제 (이름과 관계없이)
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

-- 3. RLS 활성화 확인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 4. 새로운 정책 생성 (명시적으로 public 스키마 지정)
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 5. 정책 생성 확인
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

