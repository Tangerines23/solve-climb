-- ============================================================================
-- 티어 시스템 RPC 함수 마이그레이션
-- 작성일: 2025.12.25
-- ============================================================================

-- 1. 레벨 계산 함수 (공통 로직)
CREATE OR REPLACE FUNCTION public.calculate_tier_level(
  p_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER;
BEGIN
  -- tier_definitions 테이블에서 점수에 맞는 티어 레벨 조회
  SELECT level INTO v_level
  FROM public.tier_definitions
  WHERE min_score <= p_score
  ORDER BY min_score DESC
  LIMIT 1;
  
  RETURN COALESCE(v_level, 0);  -- 기본값: 베이스캠프
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. 티어 계산 함수 (순환제)
CREATE OR REPLACE FUNCTION public.calculate_tier(
  p_total_score BIGINT
) RETURNS JSON AS $$
DECLARE
  v_cycle_cap INTEGER;
  v_cycle_count INTEGER := 0;
  v_current_cycle_score INTEGER := 0;
  v_level INTEGER := 0;
BEGIN
  -- game_config에서 사이클 기준점 로드
  SELECT value::INTEGER INTO v_cycle_cap
  FROM public.game_config
  WHERE key = 'tier_cycle_cap';
  
  -- 기본값 설정 (설정이 없을 경우)
  IF v_cycle_cap IS NULL THEN
    v_cycle_cap := 250000;
  END IF;
  
  -- 첫 사이클 이전 (250,000점 이하)
  IF p_total_score <= v_cycle_cap THEN
    v_level := public.calculate_tier_level(p_total_score::INTEGER);
    
    RETURN json_build_object(
      'level', v_level,
      'stars', 0,
      'total_score', p_total_score,
      'current_cycle_score', p_total_score
    );
  END IF;
  
  -- 사이클 이후: 사이클 수와 현재 사이클 내 점수 계산
  -- 250,001점부터 다음 사이클 시작 (버퍼 적용)
  v_cycle_count := FLOOR((p_total_score - 1) / v_cycle_cap)::INTEGER;  -- 사이클 수 (별 개수)
  v_current_cycle_score := ((p_total_score - 1) % v_cycle_cap + 1)::INTEGER;   -- 현재 사이클 내 점수 (1부터 시작)
  
  -- 현재 사이클 내 점수로 티어 레벨 결정
  v_level := public.calculate_tier_level(v_current_cycle_score);
  
  RETURN json_build_object(
    'level', v_level,
    'stars', v_cycle_count,
    'total_score', p_total_score,
    'current_cycle_score', v_current_cycle_score
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. 사용자 티어 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_tier_info JSON;
BEGIN
  -- 권한 검증: 인증된 사용자인지 확인
  IF v_authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 검증: 자신의 티어만 업데이트 가능
  IF p_user_id != v_authenticated_user_id THEN
    -- 보안 로그 기록
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_authenticated_user_id, 'permission_denied', 
            json_build_object('attempted_user_id', p_user_id))
    ON CONFLICT DO NOTHING;
    
    RAISE EXCEPTION 'Permission denied: Cannot update other user''s tier';
  END IF;
  
  -- 현재 마스터리 점수 조회
  SELECT total_mastery_score INTO v_total_mastery
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- 티어 계산 (BIGINT 직접 전달)
  v_tier_info := public.calculate_tier(COALESCE(v_total_mastery, 0));
  
  -- 프로필 업데이트
  UPDATE public.profiles
  SET
    current_tier_level = (v_tier_info->>'level')::INTEGER
  WHERE id = p_user_id;
  
  RETURN v_tier_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 게임 세션 생성 함수
CREATE OR REPLACE FUNCTION public.create_game_session(
  p_questions JSONB,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_game_mode TEXT DEFAULT 'timeattack'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_questions_for_client JSONB;
BEGIN
  -- 인증 검증
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 기존 활성 세션이 있으면 만료 처리
  UPDATE public.game_sessions
  SET status = 'expired'
  WHERE user_id = v_user_id AND status = 'playing';
  
  -- 새 세션 생성 (문제 정보 포함, 정답 포함)
  INSERT INTO public.game_sessions (
    user_id, status, expires_at, questions, category, subject, level, game_mode
  )
  VALUES (
    v_user_id, 'playing', NOW() + INTERVAL '30 minutes', 
    p_questions, p_category, p_subject, p_level, p_game_mode
  )
  RETURNING id INTO v_session_id;
  
  -- ⚠️ 보안: 클라이언트용 questions 생성 (correct_answer 필드 제거)
  SELECT jsonb_agg(q - 'correct_answer') INTO v_questions_for_client
  FROM jsonb_array_elements(p_questions) AS q;
  
  RETURN json_build_object(
    'session_id', v_session_id,
    'expires_at', (SELECT expires_at FROM public.game_sessions WHERE id = v_session_id),
    'questions', v_questions_for_client  -- 정답 제외된 문제 정보만 반환
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 게임 세션 검증 함수
CREATE OR REPLACE FUNCTION public.validate_game_session(
  p_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_status TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 세션 상태 및 만료 시간 조회
  SELECT status, expires_at INTO v_session_status, v_expires_at
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;
  
  -- 세션이 없으면 false
  IF v_session_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- 세션이 만료되었으면 false
  IF v_expires_at < NOW() THEN
    UPDATE public.game_sessions
    SET status = 'expired'
    WHERE id = p_session_id;
    RETURN false;
  END IF;
  
  -- 세션이 'playing' 상태가 아니면 false
  IF v_session_status != 'playing' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 사이클 승급 함수
CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_pending_score BIGINT;
  v_cycle_cap INTEGER;
  v_new_tier JSON;
BEGIN
  -- 인증 검증
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 승급 대기 상태 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_user_id AND cycle_promotion_pending = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No promotion pending'
    );
  END IF;
  
  -- 현재 마스터리 점수 및 대기 점수 조회
  SELECT total_mastery_score, pending_cycle_score, 
         (SELECT value::INTEGER FROM public.game_config WHERE key = 'tier_cycle_cap')
  INTO v_total_mastery, v_pending_score, v_cycle_cap
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- 사이클 기준점 기본값
  IF v_cycle_cap IS NULL THEN
    v_cycle_cap := 250000;
  END IF;
  
  -- 사이클 승급 처리
  UPDATE public.profiles
  SET
    total_mastery_score = v_cycle_cap + v_pending_score,  -- 새 사이클 시작 (250,000 + 초과 점수)
    cycle_promotion_pending = false,
    pending_cycle_score = 0,
    current_tier_level = 0  -- 베이스캠프로 리셋
  WHERE id = v_user_id;
  
  -- 새 티어 계산
  v_new_tier := public.calculate_tier(v_cycle_cap + v_pending_score);
  
  RETURN json_build_object(
    'success', true,
    'tier_info', v_new_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 마스터리 점수 재계산 함수 (데이터 무결성 보정)
CREATE OR REPLACE FUNCTION public.recalculate_mastery_scores()
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- 모든 유저의 total_mastery_score를 user_level_records에서 재계산
  UPDATE public.profiles p
  SET total_mastery_score = (
    SELECT COALESCE(SUM(best_score), 0)
    FROM public.user_level_records
    WHERE user_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.user_level_records WHERE user_id = p.id
  );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'updated_users', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 기존 유저 데이터 마이그레이션 함수
CREATE OR REPLACE FUNCTION public.migrate_existing_records()
RETURNS JSON AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_processed_users INTEGER := 0;
BEGIN
  -- 1. 기존 game_records 테이블에서 최고 기록 추출하여 user_level_records 생성
  -- ⚠️ game_records 테이블의 실제 컬럼명 확인: mode (game_mode 아님)
  INSERT INTO public.user_level_records (
    user_id, theme_code, level, mode_code, best_score
  )
  SELECT 
    gr.user_id,
    tm.code as theme_code,
    gr.level,
    mm.code as mode_code,
    MAX(gr.score) as best_score
  FROM public.game_records gr
  INNER JOIN public.theme_mapping tm 
    ON tm.theme_id = gr.category || '_' || gr.subject
  INNER JOIN public.mode_mapping mm 
    ON mm.mode_id = gr.mode  -- game_mode가 아닌 mode 사용
  WHERE gr.score > 0
  GROUP BY gr.user_id, tm.code, gr.level, mm.code
  ON CONFLICT (user_id, theme_code, level, mode_code) 
  DO UPDATE SET 
    best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
    updated_at = NOW();
  
  -- 2. total_mastery_score 계산 (모든 최고 기록 합산)
  UPDATE public.profiles p
  SET total_mastery_score = (
    SELECT COALESCE(SUM(best_score), 0)
    FROM public.user_level_records
    WHERE user_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.user_level_records WHERE user_id = p.id
  );
  
  -- 3. 티어 업데이트 (전승 충돌 방지)
  UPDATE public.profiles
  SET 
    current_tier_level = CASE
      WHEN total_mastery_score >= 250000 THEN 6  -- 전설 레벨
      ELSE (public.calculate_tier(total_mastery_score)->>'level')::INTEGER
    END,
    cycle_promotion_pending = CASE
      WHEN total_mastery_score >= 250000 THEN true
      ELSE false
    END,
    pending_cycle_score = CASE
      WHEN total_mastery_score >= 250000 THEN total_mastery_score - 250000
      ELSE 0
    END
  WHERE total_mastery_score > 0;
  
  -- 통계
  SELECT COUNT(DISTINCT user_id) INTO v_processed_users 
  FROM public.user_level_records;
  
  SELECT COUNT(*) INTO v_migrated_count FROM public.user_level_records;
  
  RETURN json_build_object(
    'success', true,
    'migrated_records', v_migrated_count,
    'processed_users', v_processed_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

