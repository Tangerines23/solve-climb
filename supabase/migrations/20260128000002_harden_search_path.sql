-- ============================================================================
-- 보안 강화 마이그레이션 (Server Function Hardening)
-- 작성일: 2026.01.28
-- 목적: SECURITY DEFINER 함수들의 search_path를 public으로 고정하여 Search Path Hijacking 방지
-- ============================================================================

-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#security-definer-functions
-- 멱등: 함수가 없으면 건너뜀 (EXCEPTION WHEN undefined_object)

DO $$
BEGIN
  ALTER FUNCTION public.sync_profile_mastery_from_records(p_user_id uuid) SET search_path = public;
EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.check_ranking_integrity() SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.test_db_resource_validation() SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.restore_default_items() SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_update_profile_stats(p_user_id uuid, p_stamina integer, p_minerals integer, p_total_mastery_score integer) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_set_inventory_quantity(p_user_id uuid, p_item_id integer, p_quantity integer) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_set_session_timer(p_session_id uuid, p_seconds integer) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_reset_inventory(p_user_id uuid) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.recover_stamina_ads() SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.get_ranking_v2(p_category text, p_period text, p_type text, p_limit integer) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.check_and_award_badges(p_user_id uuid) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.submit_game_result(p_user_answers jsonb, p_question_ids text[], p_game_mode text, p_items_used integer[], p_session_id uuid, p_world_id text, p_category text, p_subject text, p_level integer) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_generate_dummy_record(p_user_id uuid, p_world_id text, p_category text, p_subject text, p_level integer, p_correct_count integer, p_game_mode text) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.debug_run_play_scenario(p_user_id uuid, p_world_id text, p_category text, p_subject text, p_level_start integer, p_level_end integer, p_accuracy numeric) SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION public.check_profile_update_security() SET search_path = public; EXCEPTION WHEN SQLSTATE '42883' OR SQLSTATE '42704' THEN NULL; END $$;

-- 보안 감사 로그 기록 (테이블 없으면 건너뜀)
INSERT INTO public.security_audit_log (event_type, event_data)
SELECT 'security_hardened', json_build_object('reason', 'Applied search_path=public to all SECURITY DEFINER functions')
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_audit_log');
