-- ============================================================================
-- 실시간 랭킹 활성화 및 함수 긴급 수정
-- 작성일: 2026.01.27
-- 목적: Profiles 테이블 실시간 활성화 + get_ranking_v2가 삭제된 game_records 대신 user_level_records 참조하도록 수정
-- ============================================================================

-- 1. Profiles 테이블 실시간 활성화 (Realtime)
-- 기존에 추가되어 있을 수 있으므로 확인 후 추가 (PostgreSQL에서는 IF NOT EXISTS 구문이 PUBLICATION에 
-- 직접 지원되지 않으므로, 에러를 무시하거나 DO 블록 사용)
DO $$
BEGIN
    -- profiles 테이블이 아직 publications에 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;


-- 2. 랭킹 v2 조회 RPC 함수 수정 (game_records -> user_level_records)
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
    -- 주간 리그 (Weekly) - Profiles 사용 (기존 유지)
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as user_id,
            COALESCE(p.nickname, '익명 등반가') as nickname,
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

    -- 명예의 전당 (All-Time)
    ELSE
        -- 종합 (총 마스터리 점수: user_level_records의 합산으로 변경) ✨ FIX HERE
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT ulr.user_id, SUM(ulr.best_score) as total_mastery
                FROM public.user_level_records ulr
                -- 카테고리/월드 구분 없이 모든 레벨 점수 합산 (종합 마스터리)
                -- 만약 p_category 필터가 필요하다면 아래 주석 해제 (현재는 종합 랭킹이므로 전체 합산이 맞음)
                -- WHERE ulr.category_id = p_category 
                GROUP BY ulr.user_id
            )
            SELECT 
                um.user_id,
                COALESCE(p.nickname, '익명 등반가') as nickname,
                um.total_mastery::BIGINT as score,
                RANK() OVER (ORDER BY um.total_mastery DESC) as rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY score DESC
            LIMIT p_limit;
            
        -- 타임어택 / 서바이벌 (역대 최고 단일 점수) - Profiles 사용 (기존 유지)
        ELSE
            RETURN QUERY
            SELECT 
                p.id as user_id,
                COALESCE(p.nickname, '익명 등반가') as nickname,
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


-- 3. 함수 무결성 검증용(Smoke Test) 함수 추가
CREATE OR REPLACE FUNCTION test_db_rpc_validation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- Test 1: get_ranking_v2 실행 테스트 (에러 없이 실행되는지 확인)
  BEGIN
    PERFORM public.get_ranking_v2(NULL, 'weekly', 'total', 1);
    
    RETURN QUERY
    SELECT 
      'check_rpc_get_ranking_v2'::TEXT,
      TRUE,
      'RPC get_ranking_v2 executes successfully'::TEXT,
      jsonb_build_object('status', 'ok');
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'check_rpc_get_ranking_v2'::TEXT,
      FALSE,
      'RPC get_ranking_v2 raised an exception: ' || SQLERRM,
      jsonb_build_object('error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql;


-- 4. 통합 검증 함수 업데이트 (새로운 RPC 검증 추가)
CREATE OR REPLACE FUNCTION test_db_all_validations()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT, details JSONB) AS $$
BEGIN
  -- 기본 검증 (4개)
  RETURN QUERY
  SELECT 
    'check_minerals_non_negative'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE minerals < 0),
    'All profiles have non-negative minerals'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE minerals < 0));

  RETURN QUERY
  SELECT 
    'check_stamina_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE stamina < 0 OR stamina > 10),
    'All profiles have stamina in valid range (0-10)'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE stamina < 0 OR stamina > 10));

  RETURN QUERY
  SELECT 
    'check_inventory_quantity'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.inventory WHERE quantity <= 0),
    'All inventory items have positive quantity'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.inventory WHERE quantity <= 0));

  RETURN QUERY
  SELECT 
    'check_tier_level_range'::TEXT,
    (SELECT COUNT(*) = 0 FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100),
    'All profiles have tier level in valid range (0-100)'::TEXT,
    jsonb_build_object('count', (SELECT COUNT(*) FROM public.profiles WHERE current_tier_level < 0 OR current_tier_level > 100));

  -- 고급 검증 (6개)
  RETURN QUERY
  SELECT * FROM test_db_advanced_validation();

  -- RPC 무결성 검증 (NEW)
  RETURN QUERY
  SELECT * FROM test_db_rpc_validation();
END;
$$ LANGUAGE plpgsql;
