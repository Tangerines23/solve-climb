-- ============================================================================
-- today_challenges ?�이�?RLS ?�책 ?�인 �?강제 ?�생??
-- ?�성?? 2025.12.28
-- ============================================================================
-- 문제: ?�책???��?�??�성?��? ?�았?????�음
-- ?�결: ?�책???�전????��?�고 ?�생??

-- 1. ?�재 ?�책 ?�인
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'today_challenges' AND schemaname = 'public';
  
  RAISE NOTICE '?�재 today_challenges ?�책 개수: %', policy_count;
END $$;

-- 2. 모든 ?�책 ??�� (?�름�?관계없??
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

-- 3. RLS ?�성???�인
ALTER TABLE IF EXISTS public.today_challenges ENABLE ROW LEVEL SECURITY;

-- 4. ?�로???�책 ?�성 (명시?�으�?public ?�키�?지??
CREATE POLICY "Anyone can read today challenges" 
  ON public.today_challenges 
  FOR SELECT 
  USING (true);

-- 5. ?�책 ?�성 ?�인
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

