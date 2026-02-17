-- ============================================================================
-- calculate_tier ?�수 BIGINT 지???�정
-- ?�성?? 2025.12.25
-- ============================================================================
-- 문제: calculate_tier ?�수가 INTEGER�?받아??BIGINT??total_mastery_score�?처리?��? 못함
-- ?�결: ?�수 ?�그?�처�?BIGINT�?변�?

-- 2. ?�어 계산 ?�수 (?�환?? - BIGINT 지??
CREATE OR REPLACE FUNCTION public.calculate_tier(
  p_total_score BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_cycle_cap INTEGER;
  v_cycle_count INTEGER := 0;
  v_current_cycle_score INTEGER := 0;
  v_level INTEGER := 0;
BEGIN
  -- game_config?�서 ?�이??기�???로드
  SELECT value::INTEGER INTO v_cycle_cap
  FROM public.game_config
  WHERE key = 'tier_cycle_cap';
  
  -- 기본�??�정 (?�정???�을 경우)
  IF v_cycle_cap IS NULL THEN
    v_cycle_cap := 250000;
  END IF;
  
  -- �??�이???�전 (250,000???�하)
  IF p_total_score <= v_cycle_cap THEN
    v_level := public.calculate_tier_level(p_total_score::INTEGER);
    
    RETURN JSONB_build_object(
      'level', v_level,
      'stars', 0,
      'total_score', p_total_score,
      'current_cycle_score', p_total_score
    );
  END IF;
  
  -- ?�이???�후: ?�이???��? ?�재 ?�이?????�수 계산
  -- 250,001?��????�음 ?�이???�작 (버퍼 ?�용)
  v_cycle_count := FLOOR((p_total_score - 1) / v_cycle_cap)::INTEGER;  -- ?�이????(�?개수)
  v_current_cycle_score := ((p_total_score - 1) % v_cycle_cap + 1)::INTEGER;   -- ?�재 ?�이?????�수 (1부???�작)
  
  -- ?�재 ?�이?????�수�??�어 ?�벨 결정
  v_level := public.calculate_tier_level(v_current_cycle_score);
  
  RETURN JSONB_build_object(
    'level', v_level,
    'stars', v_cycle_count,
    'total_score', p_total_score,
    'current_cycle_score', v_current_cycle_score
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- update_user_tier ?�수??BIGINT 직접 ?�달?�도�??�정
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_tier_info JSON;
BEGIN
  -- 권한 검�? ?�증???�용?�인지 ?�인
  IF v_authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 권한 검�? ?�신???�어�??�데?�트 가??
  IF p_user_id != v_authenticated_user_id THEN
    -- 보안 로그 기록
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_authenticated_user_id, 'permission_denied', 
            JSONB_build_object('attempted_user_id', p_user_id))
    ON CONFLICT DO NOTHING;
    
    RAISE EXCEPTION 'Permission denied: Cannot update other user''s tier';
  END IF;
  
  -- ?�재 마스?�리 ?�수 조회
  SELECT total_mastery_score INTO v_total_mastery
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- ?�어 계산 (BIGINT 직접 ?�달)
  v_tier_info := public.calculate_tier(COALESCE(v_total_mastery, 0));
  
  -- ?�로???�데?�트
  UPDATE public.profiles
  SET
    current_tier_level = (v_tier_info->>'level')::INTEGER
  WHERE id = p_user_id;
  
  RETURN v_tier_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- promote_to_next_cycle ?�수??BIGINT 직접 ?�달?�도�??�정
CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_pending_score BIGINT;
  v_cycle_cap INTEGER;
  v_new_tier JSON;
BEGIN
  -- ?�증 검�?
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- ?�급 ?��??�태 ?�인
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_user_id AND cycle_promotion_pending = true
  ) THEN
    RETURN JSONB_build_object(
      'success', false,
      'error', 'No promotion pending'
    );
  END IF;
  
  -- ?�재 마스?�리 ?�수 �??��??�수 조회
  SELECT total_mastery_score, pending_cycle_score, 
         (SELECT value::INTEGER FROM public.game_config WHERE key = 'tier_cycle_cap')
  INTO v_total_mastery, v_pending_score, v_cycle_cap
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- ?�이??기�???기본�?
  IF v_cycle_cap IS NULL THEN
    v_cycle_cap := 250000;
  END IF;
  
  -- ?�이???�급 처리
  UPDATE public.profiles
  SET
    total_mastery_score = v_cycle_cap + v_pending_score,  -- ???�이???�작 (250,000 + 초과 ?�수)
    cycle_promotion_pending = false,
    pending_cycle_score = 0,
    current_tier_level = 0  -- 베이?�캠?�로 리셋
  WHERE id = v_user_id;
  
  -- ???�어 계산
  v_new_tier := public.calculate_tier(v_cycle_cap + v_pending_score);
  
  RETURN JSONB_build_object(
    'success', true,
    'tier_info', v_new_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

