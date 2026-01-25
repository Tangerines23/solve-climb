-- ============================================================================
-- DB 보안 및 성능 최적화 마이그레이션
-- 작성일: 2026.01.26
-- 목적: Supabase Advisor 경고 해소 및 성능 개선
-- ============================================================================

-- ============================================================================
-- 1. 함수 search_path 설정 (보안 강화)
-- ============================================================================
-- 모든 public 함수에 search_path를 명시적으로 설정하여
-- 악의적인 스키마 오염 공격 방지

ALTER FUNCTION public.add_minerals SET search_path = public;
ALTER FUNCTION public.calculate_tier SET search_path = public;
ALTER FUNCTION public.calculate_tier_level SET search_path = public;
ALTER FUNCTION public.check_and_award_badges SET search_path = public;
ALTER FUNCTION public.check_and_recover_stamina SET search_path = public;
ALTER FUNCTION public.consume_item SET search_path = public;
ALTER FUNCTION public.consume_stamina SET search_path = public;
ALTER FUNCTION public.create_game_session SET search_path = public;
ALTER FUNCTION public.debug_grant_badge SET search_path = public;
ALTER FUNCTION public.debug_grant_items SET search_path = public;
ALTER FUNCTION public.debug_remove_badge SET search_path = public;
ALTER FUNCTION public.debug_reset_profile SET search_path = public;
ALTER FUNCTION public.debug_set_mastery_score SET search_path = public;
ALTER FUNCTION public.debug_set_tier SET search_path = public;
ALTER FUNCTION public.find_user_by_email SET search_path = public;
ALTER FUNCTION public.find_user_by_toss_key SET search_path = public;
ALTER FUNCTION public.get_leaderboard SET search_path = public;
ALTER FUNCTION public.get_ranking SET search_path = public;
ALTER FUNCTION public.get_ranking_v2 SET search_path = public;
ALTER FUNCTION public.get_user_id_by_toss_key SET search_path = public;
ALTER FUNCTION public.handle_daily_login SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
ALTER FUNCTION public.migrate_existing_records SET search_path = public;
ALTER FUNCTION public.promote_to_next_cycle SET search_path = public;
ALTER FUNCTION public.purchase_item SET search_path = public;
ALTER FUNCTION public.recalculate_mastery_scores SET search_path = public;
ALTER FUNCTION public.recover_stamina_ads SET search_path = public;
ALTER FUNCTION public.reset_weekly_scores SET search_path = public;
ALTER FUNCTION public.submit_game_result SET search_path = public;
ALTER FUNCTION public.update_profile_nickname SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
ALTER FUNCTION public.update_user_tier SET search_path = public;
ALTER FUNCTION public.user_exists_by_email SET search_path = public;
ALTER FUNCTION public.validate_game_session SET search_path = public;

-- ============================================================================
-- 2. 인덱스 추가 (성능 개선)
-- ============================================================================

-- inventory 테이블 FK 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON public.inventory(item_id);

-- ============================================================================
-- 3. RLS 정책 최적화 (성능 개선)
-- ============================================================================
-- auth.uid()를 (SELECT auth.uid())로 변경하여 매 행마다 재평가되지 않도록 최적화

-- inventory 테이블
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
CREATE POLICY "Users can view own inventory" ON public.inventory
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
CREATE POLICY "Users can update own inventory" ON public.inventory
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_records 테이블
DROP POLICY IF EXISTS "Users can view own records" ON public.game_records;
CREATE POLICY "Users can view own records" ON public.game_records
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own records" ON public.game_records;
CREATE POLICY "Users can insert own records" ON public.game_records
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own records" ON public.game_records;
CREATE POLICY "Users can update own records" ON public.game_records
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- profiles 테이블
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- user_badges 테이블
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- user_level_records 테이블
DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" ON public.user_level_records
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own records" ON public.user_level_records;
CREATE POLICY "Users can insert own records" ON public.user_level_records
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own records" ON public.user_level_records;
CREATE POLICY "Users can update own records" ON public.user_level_records
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_sessions 테이블
DROP POLICY IF EXISTS "Users can view own sessions" ON public.game_sessions;
CREATE POLICY "Users can view own sessions" ON public.game_sessions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.game_sessions;
CREATE POLICY "Users can insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own sessions" ON public.game_sessions;
CREATE POLICY "Users can update own sessions" ON public.game_sessions
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- game_results 테이블
DROP POLICY IF EXISTS "Users can view own results" ON public.game_results;
CREATE POLICY "Users can view own results" ON public.game_results
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own results" ON public.game_results;
CREATE POLICY "Users can insert own results" ON public.game_results
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 4. 검증 쿼리
-- ============================================================================

-- 함수 search_path 확인
SELECT 
  routine_name,
  prosrc LIKE '%search_path%' AS has_search_path
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname = 'idx_inventory_item_id';
