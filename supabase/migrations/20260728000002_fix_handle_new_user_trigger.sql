-- Migration: Fix handle_new_user trigger function to remove non-existent avatar_url column
-- Date: 2026-07-28
-- Description: Resolves 500 Internal Server Error during auth signup caused by missing avatar_url column.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  INSERT INTO public.profiles (
    id,
    nickname,
    stamina,
    minerals,
    weekly_score_total,
    total_mastery_score,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'nickname'), ''), '익명 등반가'),
    5,
    0,
    0,
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN new;
END;
$$;
