-- ============================================================================
-- RLS 비활성 public 테이블 전부 활성화 (check_rls_enabled 통과)
-- ============================================================================
-- pre-commit 훅의 check:db:validation → check_rls_enabled 실패 해소.
-- public 스키마에서 rowsecurity = false 인 테이블에 RLS 활성화 및 기본 SELECT 정책 추가.
-- (매핑 테이블·읽기 전용 테이블은 SELECT USING (true)로 충분. 사용자별 테이블은 기존 마이그레이션에서 이미 RLS+정책 적용됨.)
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
