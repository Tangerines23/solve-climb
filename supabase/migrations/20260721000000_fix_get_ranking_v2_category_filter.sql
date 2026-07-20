-- Fix get_ranking_v2 function: Remove invalid NULL self-comparison in WHERE clause and grant EXECUTE permissions to anon & authenticated roles

CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category pg_catalog.text,
    p_period pg_catalog.text,
    p_type pg_catalog.text,
    p_limit pg_catalog.int4 DEFAULT 50
)
RETURNS TABLE (
    out_user_id pg_catalog.uuid,
    out_nickname pg_catalog.text,
    out_score pg_catalog.int8,
    out_rank pg_catalog.int8
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
            COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
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
            )::pg_catalog.int8 as out_rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0::pg_catalog.int8
        ORDER BY 3 DESC
        LIMIT p_limit;
    ELSE
        -- All-Time (Total Mastery)
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, pg_catalog.sum(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                WHERE (p_category IS NULL OR p_category = 'all'::pg_catalog.text OR ulr.category_id = p_category)
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id as out_user_id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
                um.total_mastery::pg_catalog.int8 as out_score,
                pg_catalog.rank() OVER (ORDER BY um.total_mastery DESC)::pg_catalog.int8 as out_rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY 3 DESC
            LIMIT p_limit;
        ELSE
            -- Best Score per mode
            RETURN QUERY
            SELECT 
                p.id as out_user_id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as out_nickname,
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
                )::pg_catalog.int8 as out_rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY 3 DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) TO anon, authenticated;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'test_db_all_validations') THEN
    GRANT EXECUTE ON FUNCTION public.test_db_all_validations() TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_mastery_consistency') THEN
    GRANT EXECUTE ON FUNCTION public.check_mastery_consistency() TO anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'test_db_rpc_validation') THEN
    GRANT EXECUTE ON FUNCTION public.test_db_rpc_validation() TO anon, authenticated;
  END IF;
END $$;
