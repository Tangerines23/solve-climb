-- Add update_profile_nickname RPC function & append unique tag to duplicate nicknames in get_ranking_v2

-- 1. Create update_profile_nickname RPC
CREATE OR REPLACE FUNCTION public.update_profile_nickname(p_nickname pg_catalog.text)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id pg_catalog.uuid := auth.uid();
    v_clean_nickname pg_catalog.text;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    v_clean_nickname := pg_catalog.trim(p_nickname);
    IF pg_catalog.length(v_clean_nickname) < 2 OR pg_catalog.length(v_clean_nickname) > 12 THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', '닉네임은 2자 이상 12자 이하이어야 합니다.');
    END IF;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', 'true', true);

    UPDATE public.profiles
    SET nickname = v_clean_nickname,
        updated_at = pg_catalog.now()
    WHERE id = v_user_id;

    PERFORM pg_catalog.set_config('app.bypass_profile_security', '', true);

    RETURN pg_catalog.jsonb_build_object('success', true, 'nickname', v_clean_nickname);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_profile_nickname(pg_catalog.text) TO anon, authenticated;

-- 2. Update get_ranking_v2 with duplicate nickname tag logic
DROP FUNCTION IF EXISTS public.get_ranking_v2(pg_catalog.text, pg_catalog.text, pg_catalog.text, pg_catalog.int4);
DROP FUNCTION IF EXISTS public.get_ranking_v2(text, text, text, integer);

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
        WITH profile_display AS (
            SELECT 
                p.id,
                COALESCE(p.nickname, '익명 등반가'::pg_catalog.text) as raw_nick,
                p.weekly_score_total,
                p.weekly_score_timeattack,
                p.weekly_score_survival,
                pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
            FROM public.profiles p
        )
        SELECT 
            pd.id as user_id,
            CASE 
                WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                ELSE pd.raw_nick
            END as nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN pd.weekly_score_timeattack::pg_catalog.int8
                WHEN p_type = 'survival' THEN pd.weekly_score_survival::pg_catalog.int8
                ELSE pd.weekly_score_total::pg_catalog.int8
            END as score,
            pg_catalog.rank() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN pd.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN pd.weekly_score_survival
                        ELSE pd.weekly_score_total
                    END
                ) DESC
            )::pg_catalog.int8 as rank
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
                    pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
                FROM public.profiles p
            )
            SELECT 
                um.mastery_user_id as user_id,
                CASE 
                    WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                    ELSE pd.raw_nick
                END as nickname,
                um.total_mastery::pg_catalog.int8 as score,
                pg_catalog.rank() OVER (ORDER BY um.total_mastery DESC)::pg_catalog.int8 as rank
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
                    p.best_score_timeattack,
                    p.best_score_survival,
                    pg_catalog.count(*) OVER (PARTITION BY COALESCE(p.nickname, '익명 등반가'::pg_catalog.text)) as nick_count
                FROM public.profiles p
            )
            SELECT 
                pd.id as user_id,
                CASE 
                    WHEN pd.nick_count > 1 THEN pd.raw_nick || ' #' || pg_catalog.right(pg_catalog.replace(pd.id::pg_catalog.text, '-'::pg_catalog.text, ''::pg_catalog.text), 4)
                    ELSE pd.raw_nick
                END as nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN pd.best_score_timeattack::pg_catalog.int8
                    ELSE pd.best_score_survival::pg_catalog.int8
                END as score,
                pg_catalog.rank() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN pd.best_score_timeattack
                            ELSE pd.best_score_survival
                        END
                    ) DESC
                )::pg_catalog.int8 as rank
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
