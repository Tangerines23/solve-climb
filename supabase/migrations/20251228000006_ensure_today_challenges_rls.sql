-- ============================================================================
-- today_challenges ?�이�?RLS ?�책 최종 ?�인 �??�생??
-- ?�성?? 2025.12.28
-- ============================================================================
-- 문제: ?�전??406 ?�러 발생
-- ?�결: RLS ?�책???�전???�생?�하�??�명 ?�용?�도 명시?�으�??�용

-- 1. 모든 ?�책 ??��
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
    RAISE NOTICE '?�책 ??��: %', r.policyname;
  END LOOP;
END $$;

-- 2. RLS ?�성???�인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 3. ?�로???�책 ?�성: USING (true)??모든 ??��???�동 ?�용
-- ?��?�?명시?�으�??�명 ?�용?�도 ?�용?�도�??�정
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 4. ?�책 ?�인
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'today_challenges' AND schemaname = 'public';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '?�책 ?�성 ?�공! ?�책 개수: %', policy_count;
  ELSE
    RAISE EXCEPTION '?�책 ?�성 ?�패!';
  END IF;
END $$;

