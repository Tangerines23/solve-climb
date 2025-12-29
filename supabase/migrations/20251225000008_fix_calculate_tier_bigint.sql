-- ============================================================================
-- calculate_tier 함수 BIGINT 지원 수정
-- 작성일: 2025.12.25
-- ============================================================================
-- 문제: calculate_tier 함수가 INTEGER만 받아서 BIGINT인 total_mastery_score를 처리하지 못함
-- 해결: 함수 시그니처를 BIGINT로 변경

-- 2. 티어 계산 함수 (순환제) - BIGINT 지원
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

-- update_user_tier 함수도 BIGINT 직접 전달하도록 수정
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

-- promote_to_next_cycle 함수도 BIGINT 직접 전달하도록 수정
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

