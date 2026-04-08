-- [PERFORMANCE OPTIMIZATION] Ranking Speedup & Auto-Maintenance
-- Date: 2026-04-08

-- 1. Create Performance Indices for Ranking
CREATE INDEX IF NOT EXISTS idx_profiles_total_mastery ON public.profiles(total_mastery_score DESC) WHERE total_mastery_score > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_total ON public.profiles(weekly_score_total DESC) WHERE weekly_score_total > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_best_timeattack ON public.profiles(best_score_timeattack DESC) WHERE best_score_timeattack > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_best_survival ON public.profiles(best_score_survival DESC) WHERE best_score_survival > 0;

-- 2. Optimize get_ranking_v2 (Use Pre-calculated columns for all-time total)
CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category pg_catalog.text,
    p_period pg_catalog.text,
    p_type pg_catalog.text,
    p_limit pg_catalog.int4 DEFAULT 50
)
RETURNS TABLE (
    user_id pg_catalog.uuid,
    nickname pg_catalog.text,
    score pg_catalog.int8,
    rank pg_catalog.int8
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as out_user_id,
            pg_catalog.COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::pg_catalog.int8
                WHEN p_type = 'survival' THEN p.weekly_score_survival::pg_catalog.int8
                ELSE p.weekly_score_total::pg_catalog.int8
            END as out_score,
            pg_catalog.rank() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            ) as out_rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0
        ORDER BY out_score DESC
        LIMIT p_limit;
    ELSE
        -- All-Time (Total Mastery)
        IF p_type = 'total' THEN
            RETURN QUERY
            SELECT 
                p.id as out_user_id,
                pg_catalog.COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
                p.total_mastery_score::pg_catalog.int8 as out_score,
                pg_catalog.rank() OVER (ORDER BY p.total_mastery_score DESC) as out_rank
            FROM public.profiles p
            WHERE p.total_mastery_score > 0
            ORDER BY out_score DESC
            LIMIT p_limit;
        ELSE
            -- Best Score per mode (Using cached best scores in profile)
            RETURN QUERY
            SELECT 
                p.id as out_user_id,
                pg_catalog.COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::pg_catalog.int8
                    ELSE p.best_score_survival::pg_catalog.int8
                END as out_score,
                pg_catalog.rank() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                ) as out_rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY out_score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) TO authenticated;

-- 3. Automated Session Cleanup (TTL)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions(p_days_to_keep pg_catalog.int4 DEFAULT 7)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deleted_count pg_catalog.int4;
BEGIN
    DELETE FROM public.game_sessions
    WHERE created_at < (pg_catalog.now() - (p_days_to_keep || ' days')::pg_catalog.INTERVAL)
    AND status IN ('completed', 'expired'); -- Only cleanup finished sessions

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'message', v_deleted_count || ' expired sessions purged.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_sessions(pg_catalog.int4) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions(pg_catalog.int4) TO service_role;

COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Purges game sessions older than X days to prevent database bloat from large JSON payloads.';

-- 4. Prune Legacy/Redundant Functions
DROP FUNCTION IF EXISTS public.update_user_game_stats(INTEGER, INTEGER, FLOAT);
DROP FUNCTION IF EXISTS public.debug_clear_game_records(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.test_db_constraints();
DROP FUNCTION IF EXISTS public.test_db_advanced_validation();

-- 5. Final self-healing
SELECT public.recalculate_mastery_scores();
