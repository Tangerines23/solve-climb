-- [CLEANUP] Remove legacy and redundant tables
-- Date: 2026-04-08
-- Description: Drops tables that are no longer used by the active codebase or the latest consolidated RPC functions.

-- 1. Drop Legacy Log Tables
DROP TABLE IF EXISTS public.game_records CASCADE;
DROP TABLE IF EXISTS public.game_activity CASCADE;

-- 2. Drop Redundant History/Stats Tables
-- Note: These were superseded by user_level_records 집계 logic.
DROP TABLE IF EXISTS public.user_game_logs CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;

-- Comments for documentation
COMMENT ON COLUMN public.user_level_records.best_score IS 'Primary source for user progress and stats. Replaces the need for user_statistics and user_game_logs.';
