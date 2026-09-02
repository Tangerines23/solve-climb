-- Migration: Add anonymous silhouette emoji (👤) to anonymous users in get_ranking_v2
-- Date: 2026-09-02
-- Description: Differentiates anonymous/guest accounts from authenticated social accounts in the ranking leaderboard.

DROP FUNCTION IF EXISTS public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4) CASCADE;
DROP FUNCTION IF EXISTS public.get_ranking_v2(text, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_ranking_v2 CASCADE;

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
        WITH profile_display AS (
            SELECT 
                p.id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as raw_nick,
                COALESCE(u.is_anonymous, (u.email IS NULL AND NOT COALESCE(p.is_dummy, false)), false) as is_anon,
                p.weekly_score_total,
                p.weekly_score_timeattack,
                p.weekly_score_survival,
                pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
            FROM public.profiles p
            LEFT JOIN auth.users u ON p.id = u.id
        )
        SELECT 
            pd.id as out_user_id,
            (CASE WHEN pd.is_anon THEN '👤 ' ELSE '' END) || 
            (CASE 
                WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                ELSE pd.raw_nick
            END) as out_nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN pd.weekly_score_timeattack::pg_catalog.int8
                WHEN p_type = 'survival' THEN pd.weekly_score_survival::pg_catalog.int8
                ELSE pd.weekly_score_total::pg_catalog.int8
            END as out_score,
            pg_catalog.rank() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN pd.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN pd.weekly_score_survival
                        ELSE pd.weekly_score_total
                    END
                ) DESC
            )::pg_catalog.int8 as out_rank
        FROM profile_display pd
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN pd.weekly_score_timeattack
                WHEN p_type = 'survival' THEN pd.weekly_score_survival
                ELSE pd.weekly_score_total
            END
        ) > 0::pg_catalog.int8
        ORDER BY 3 DESC
        LIMIT p_limit;
    ELSE
        -- All-Time (Total Mastery)
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id as mastery_user_id, pg_catalog.sum(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                WHERE (p_category IS NULL OR p_category = 'all'::pg_catalog.text OR ulr.category_id = p_category)
                GROUP BY ulr.user_id
            ),
            profile_display AS (
                SELECT 
                    p.id,
                    COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as raw_nick,
                    COALESCE(u.is_anonymous, (u.email IS NULL AND NOT COALESCE(p.is_dummy, false)), false) as is_anon,
                    pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
                FROM public.profiles p
                LEFT JOIN auth.users u ON p.id = u.id
            )
            SELECT 
                um.mastery_user_id as out_user_id,
                (CASE WHEN pd.is_anon THEN '👤 ' ELSE '' END) || 
                (CASE 
                    WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                    ELSE pd.raw_nick
                END) as out_nickname,
                um.total_mastery::pg_catalog.int8 as out_score,
                pg_catalog.rank() OVER (ORDER BY um.total_mastery DESC)::pg_catalog.int8 as out_rank
            FROM user_mastery um
            LEFT JOIN profile_display pd ON um.mastery_user_id = pd.id
            ORDER BY 3 DESC
            LIMIT p_limit;
        ELSE
            -- Best Score per mode
            RETURN QUERY
            WITH profile_display AS (
                SELECT 
                    p.id,
                    COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as raw_nick,
                    COALESCE(u.is_anonymous, (u.email IS NULL AND NOT COALESCE(p.is_dummy, false)), false) as is_anon,
                    p.best_score_timeattack,
                    p.best_score_survival,
                    pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
                FROM public.profiles p
                LEFT JOIN auth.users u ON p.id = u.id
            )
            SELECT 
                pd.id as out_user_id,
                (CASE WHEN pd.is_anon THEN '👤 ' ELSE '' END) || 
                (CASE 
                    WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                    ELSE pd.raw_nick
                END) as out_nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN pd.best_score_timeattack::pg_catalog.int8
                    ELSE pd.best_score_survival::pg_catalog.int8
                END as out_score,
                pg_catalog.rank() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN pd.best_score_timeattack
                            ELSE pd.best_score_survival
                        END
                    ) DESC
                )::pg_catalog.int8 as out_rank
            FROM profile_display pd
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN pd.best_score_timeattack
                    ELSE pd.best_score_survival
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
