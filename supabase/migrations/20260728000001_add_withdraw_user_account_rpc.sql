-- Migration: Add withdraw_user_account RPC & reset_user_progress wrapper
-- Date: 2026-07-28
-- Description: Enables server-side account deletion via RPC without requiring CORS/Edge Function dependencies.

-- 1. Create withdraw_user_account RPC
CREATE OR REPLACE FUNCTION public.withdraw_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  -- 관련 테이블 데이터 삭제
  DELETE FROM public.user_level_records WHERE user_id = v_user_id;
  DELETE FROM public.inventory WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN pg_catalog.jsonb_build_object('success', true, 'message', 'Account deleted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN pg_catalog.jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_user_account() TO authenticated;

-- 2. Create reset_user_progress RPC wrapper
CREATE OR REPLACE FUNCTION public.reset_user_progress()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.secure_reset_progress();
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_user_progress() TO authenticated, anon;
