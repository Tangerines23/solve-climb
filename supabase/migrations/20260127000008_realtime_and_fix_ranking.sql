-- ============================================================================
-- ?�시�???�� ?�성??�??�수 긴급 ?�정
-- ?�성?? 2026.01.27
-- 목적: Profiles ?�이�??�시�??�성??+ get_ranking_v2가 ??��??game_records ?�??user_level_records 참조?�도�??�정
-- ============================================================================

-- 1. Profiles ?�이�??�시�??�성??(Realtime)
-- 기존??추�??�어 ?�을 ???�으므�??�인 ??추�? (PostgreSQL?�서??IF NOT EXISTS 구문??PUBLICATION??
-- 직접 지?�되지 ?�으므�? ?�러�?무시?�거??DO 블록 ?�용)
DO $$
BEGIN
    -- profiles ?�이블이 ?�직 publications???�으�?추�?
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;


-- 2. ??�� v2 조회 RPC ?�수 ?�정 (game_records -> user_level_records)
-- p_period: 'weekly', 'all-time'
-- p_type: 'total', 'time-attack', 'survival'
CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category TEXT,
    p_period TEXT,
    p_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    nickname TEXT,
    score BIGINT,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 주간 리그 (Weekly) - Profiles ?�용 (기존 ?��?)
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as user_id,
            COALESCE(p.nickname, '?�명 ?�반가') as nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::BIGINT
                WHEN p_type = 'survival' THEN p.weekly_score_survival::BIGINT
                ELSE p.weekly_score_total::BIGINT
            END as score,
            RANK() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            ) as rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0
        ORDER BY score DESC
        LIMIT p_limit;

    -- 명예???�당 (All-Time)
    ELSE
        -- 종합 (�?마스?�리 ?�수: user_level_records???�산?�로 변�? ??FIX HERE
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, SUM(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                -- 카테고리/?�드 구분 ?�이 모든 ?�벨 ?�수 ?�산 (종합 마스?�리)
                -- 만약 p_category ?�터가 ?�요?�다�??�래 주석 ?�제 (?�재??종합 ??��?��?�??�체 ?�산??맞음)
                -- WHERE ulr.category_id = p_category 
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id,
                COALESCE(p.nickname, '?�명 ?�반가') as nickname,
                um.total_mastery::BIGINT as score,
                RANK() OVER (ORDER BY um.total_mastery DESC) as rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY score DESC
            LIMIT p_limit;
            
        -- ?�?�어??/ ?�바?�벌 (??? 최고 ?�일 ?�수) - Profiles ?�용 (기존 ?��?)
        ELSE
            RETURN QUERY
            SELECT 
                p.id as user_id,
                COALESCE(p.nickname, '?�명 ?�반가') as nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::BIGINT
                    ELSE p.best_score_survival::BIGINT
                END as score,
                RANK() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                ) as rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;


-- 3. ?�수 무결??검증용(Smoke Test) ?�수 추�?
CREATE OR REPLACE FUNCTION test_db_rpc_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: get_ranking_v2 ?�행 ?�스??(?�러 ?�이 ?�행?�는지 ?�인)
  BEGIN
    PERFORM public.get_ranking_v2(NULL, 'weekly', 'total', 1);
    
    RETURN QUERY
    SELECT 
      'check_rpc_get_ranking_v2'::TEXT,
      TRUE,
      'RPC get_ranking_v2 executes successfully'::TEXT,
      JSONB_build_object('status', 'ok');
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'check_rpc_get_ranking_v2'::TEXT,
      FALSE,
      'RPC get_ranking_v2 raised an exception: ' || SQLERRM,
      JSONB_build_object('error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql;


-- 4. ?�합 검�??�수 ?�데?�트 (?�로??RPC 검�?추�?)
CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- 기본 검�?(4�?
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE stamina < 0 OR stamina > 10));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    JSONB_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- 고급 검�?(6�?
  RETURN QUERY
  SELECT * FROM test_db_advanced_validation();

  -- RPC 무결??검�?(NEW)
  RETURN QUERY
  SELECT * FROM test_db_rpc_validation();
END;
$$ LANGUAGE plpgsql;
