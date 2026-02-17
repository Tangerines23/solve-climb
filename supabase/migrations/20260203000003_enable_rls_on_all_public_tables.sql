-- ============================================================================
-- RLS 비활??public ?�이�??��? ?�성??(check_rls_enabled ?�과)
-- ============================================================================
-- pre-commit ?�의 check:db:validation ??check_rls_enabled ?�패 ?�소.
-- public ?�키마에??rowsecurity = false ???�이블에 RLS ?�성??�?기본 SELECT ?�책 추�?.
-- (매핑 ?�이블·읽�??�용 ?�이블�? SELECT USING (true)�?충분. ?�용?�별 ?�이블�? 기존 마이그레?�션?�서 ?��? RLS+?�책 ?�용??)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  policy_count int;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = r.tablename;

    IF policy_count = 0 THEN
      EXECUTE format(
        'CREATE POLICY "Enable read access for all users" ON public.%I FOR SELECT USING (true)',
        r.tablename
      );
    END IF;
  END LOOP;
END $$;
