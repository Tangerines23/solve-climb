-- ============================================================================
-- DB 보안 �??�능 최적??마이그레?�션
-- ?�성?? 2026.01.26
-- 목적: Supabase Advisor 경고 ?�소 �??�능 개선
-- ============================================================================

-- ============================================================================
-- 1. ?�수 search_path ?�정 (보안 강화)
-- ============================================================================
-- 모든 public ?�수??search_path�?명시?�으�??�정?�여
-- ?�의?�인 ?�키�??�염 공격 방�?

DO $$
DECLARE
    r RECORD;
    v_func_names TEXT[] := ARRAY[
        'add_minerals', 'calculate_tier', 'calculate_tier_level', 'check_and_award_badges',
        'check_and_recover_stamina', 'consume_item', 'consume_stamina', 'create_game_session',
        'debug_grant_badge', 'debug_grant_items', 'debug_remove_badge', 'debug_reset_profile',
        'debug_set_mastery_score', 'debug_set_tier', 'find_user_by_email', 'find_user_by_toss_key',
        'get_leaderboard', 'get_ranking', 'get_ranking_v2', 'get_user_id_by_toss_key',
        'handle_daily_login', 'handle_new_user', 'migrate_existing_records', 'promote_to_next_cycle',
        'purchase_item', 'recalculate_mastery_scores', 'recover_stamina_ads', 'reset_weekly_scores',
        'submit_game_result', 'update_profile_nickname', 'update_updated_at_column',
        'update_user_tier', 'user_exists_by_email', 'validate_game_session'
    ];
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(v_func_names)
    ) LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
    END LOOP;
END $$;

-- ============================================================================
-- 2. ?�덱??추�? (?�능 개선)
-- ============================================================================

-- inventory ?�이�?FK ?�덱??추�?
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON public.inventory(item_id);

-- ============================================================================
-- 3. RLS ?�책 최적??(?�능 개선)
-- ============================================================================
-- auth.uid()�?(SELECT auth.uid())�?변경하??�??�마???�평가?��? ?�도�?최적??

-- inventory ?�이�?
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" ON public.inventory
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
CREATE POLICY "Users can update own inventory" ON public.inventory
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_records ?�이�?
DROP POLICY IF EXISTS "Users can view own records" ON public.game_records;
CREATE POLICY "Users can view own records" ON public.game_records
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own records" ON public.game_records;
CREATE POLICY "Users can insert own records" ON public.game_records
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own records" ON public.game_records;
CREATE POLICY "Users can update own records" ON public.game_records
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- profiles ?�이�?
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- user_badges ?�이�?
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- user_level_records ?�이�?
DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" ON public.user_level_records
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own records" ON public.user_level_records;
CREATE POLICY "Users can insert own records" ON public.user_level_records
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own records" ON public.user_level_records;
CREATE POLICY "Users can update own records" ON public.user_level_records
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_sessions ?�이�?
DROP POLICY IF EXISTS "Users can view own sessions" ON public.game_sessions;
CREATE POLICY "Users can view own sessions" ON public.game_sessions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.game_sessions;
CREATE POLICY "Users can insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own sessions" ON public.game_sessions;
CREATE POLICY "Users can update own sessions" ON public.game_sessions
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_results 테이블 (존재하는 경우에만 정책 적용)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_results') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own results" ON public.game_results';
    EXECUTE 'CREATE POLICY "Users can view own results" ON public.game_results FOR SELECT USING (user_id = (SELECT auth.uid()))';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own results" ON public.game_results';
    EXECUTE 'CREATE POLICY "Users can insert own results" ON public.game_results FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()))';
  END IF;
END $$;

-- ============================================================================
-- 4. 검�?쿼리
-- ============================================================================

-- ?�수 search_path ?�인
SELECT 
  routine_name,
  prosrc LIKE '%search_path%' AS has_search_path
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ?�덱???�인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname = 'idx_inventory_item_id';
