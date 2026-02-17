-- ============================================================================
-- ?�어 ?�스??RPC ?�수 마이그레?�션
-- ?�성?? 2025.12.25
-- ============================================================================

-- 1. ?�벨 계산 ?�수 (공통 로직)
CREATE OR REPLACE FUNCTION public.calculate_tier_level(
  p_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER;
BEGIN
  -- tier_definitions ?�이블에???�수??맞는 ?�어 ?�벨 조회
  SELECT level INTO v_level
  FROM public.tier_definitions
  WHERE min_score <= p_score
  ORDER BY min_score DESC
  LIMIT 1;
  
  RETURN COALESCE(v_level, 0);  -- 기본�? 베이?�캠??
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. ?�어 계산 ?�수 (?�환??
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

-- 3. ?�용???�어 ?�데?�트 ?�수
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_tier_info JSONB;
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

-- 4. 게임 ?�션 ?�성 ?�수
CREATE OR REPLACE FUNCTION public.create_game_session(
  p_questions JSONB,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1,
  p_game_mode TEXT DEFAULT 'timeattack'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
  v_questions_for_client JSONB;
BEGIN
  -- ?�증 검�?
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 기존 ?�성 ?�션???�으�?만료 처리
  UPDATE public.game_sessions
  SET status = 'expired'
  WHERE user_id = v_user_id AND status = 'playing';
  
  -- ???�션 ?�성 (문제 ?�보 ?�함, ?�답 ?�함)
  INSERT INTO public.game_sessions (
    user_id, status, expires_at, questions, category, subject, level, game_mode
  )
  VALUES (
    v_user_id, 'playing', NOW() + INTERVAL '30 minutes', 
    p_questions, p_category, p_subject, p_level, p_game_mode
  )
  RETURNING id INTO v_session_id;
  
  -- ?�️ 보안: ?�라?�언?�용 questions ?�성 (correct_answer ?�드 ?�거)
  SELECT JSONB_agg(q - 'correct_answer') INTO v_questions_for_client
  FROM JSONB_array_elements(p_questions) AS q;
  
  RETURN JSONB_build_object(
    'session_id', v_session_id,
    'expires_at', (SELECT expires_at FROM public.game_sessions WHERE id = v_session_id),
    'questions', v_questions_for_client  -- ?�답 ?�외??문제 ?�보�?반환
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 게임 ?�션 검�??�수
CREATE OR REPLACE FUNCTION public.validate_game_session(
  p_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_status TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- ?�션 ?�태 �?만료 ?�간 조회
  SELECT status, expires_at INTO v_session_status, v_expires_at
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;
  
  -- ?�션???�으�?false
  IF v_session_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- ?�션??만료?�었?�면 false
  IF v_expires_at < NOW() THEN
    UPDATE public.game_sessions
    SET status = 'expired'
    WHERE id = p_session_id;
    RETURN false;
  END IF;
  
  -- ?�션??'playing' ?�태가 ?�니�?false
  IF v_session_status != 'playing' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ?�이???�급 ?�수
CREATE OR REPLACE FUNCTION public.promote_to_next_cycle()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_mastery BIGINT;
  v_pending_score BIGINT;
  v_cycle_cap INTEGER;
  v_new_tier JSONB;
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

-- 7. 마스?�리 ?�수 ?�계???�수 (?�이??무결??보정)
CREATE OR REPLACE FUNCTION public.recalculate_mastery_scores()
RETURNS JSONB AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- 모든 ?��???total_mastery_score�?user_level_records?�서 ?�계??
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
  
  RETURN JSONB_build_object(
    'success', true,
    'updated_users', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 기존 ?��? ?�이??마이그레?�션 ?�수
CREATE OR REPLACE FUNCTION public.migrate_existing_records()
RETURNS JSONB AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_processed_users INTEGER := 0;
BEGIN
  -- 1. 기존 game_records ?�이블에??최고 기록 추출?�여 user_level_records ?�성
  -- ?�️ game_records ?�이블의 ?�제 컬럼�??�인: mode (game_mode ?�님)
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
    ON mm.mode_id = gr.mode  -- game_mode가 ?�닌 mode ?�용
  WHERE gr.score > 0
  GROUP BY gr.user_id, tm.code, gr.level, mm.code
  ON CONFLICT (user_id, theme_code, level, mode_code) 
  DO UPDATE SET 
    best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
    updated_at = NOW();
  
  -- 2. total_mastery_score 계산 (모든 최고 기록 ?�산)
  UPDATE public.profiles p
  SET total_mastery_score = (
    SELECT COALESCE(SUM(best_score), 0)
    FROM public.user_level_records
    WHERE user_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.user_level_records WHERE user_id = p.id
  );
  
  -- 3. ?�어 ?�데?�트 (?�승 충돌 방�?)
  UPDATE public.profiles
  SET 
    current_tier_level = CASE
      WHEN total_mastery_score >= 250000 THEN 6  -- ?�설 ?�벨
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
  
  -- ?�계
  SELECT COUNT(DISTINCT user_id) INTO v_processed_users 
  FROM public.user_level_records;
  
  SELECT COUNT(*) INTO v_migrated_count FROM public.user_level_records;
  
  RETURN JSONB_build_object(
    'success', true,
    'migrated_records', v_migrated_count,
    'processed_users', v_processed_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

