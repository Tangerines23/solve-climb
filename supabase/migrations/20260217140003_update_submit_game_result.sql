-- ============================================================================
-- submit_game_result ?�수???�버�??�션 ?�외 처리 추�?
-- ?�성?? 2025.01.01
-- ============================================================================

-- submit_game_result ?�수???�태미나 검�?부�??�정
-- ?�체 ?�수�??�생?�하?? ?�태미나 검�?블록�??�정

CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers INTEGER[],
  p_question_ids UUID[],
  p_game_mode TEXT,
  p_items_used INTEGER[],
  p_session_id UUID,
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_id INTEGER;
  v_old_best_score INTEGER;
  v_new_best_score INTEGER;
  v_score_diff INTEGER;
  v_calculated_score INTEGER := 0;
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_previous_tier JSON;
  v_current_tier JSON;
  v_tier_upgraded BOOLEAN := false;
  v_total_mastery BIGINT;
  v_theme_code SMALLINT;
  v_mode_code SMALLINT;
  v_is_debug_session BOOLEAN;  -- ?�️ 추�?: ?�버�??�션 ?�래�?(?�수 ?�체?�서 ?�용)
  -- 검�??�수
  MAX_SCORE INTEGER := 1000000;
  MAX_MINERALS INTEGER := 10000;
  MAX_LEVEL INTEGER := 100;
  MIN_LEVEL INTEGER := 1;
  MINERALS_PER_SCORE INTEGER := 100;
BEGIN
  -- 0. ?�버�??�션 ?�래�?조회 (?�수 ?�체?�서 ?�용)
  SELECT is_debug_session INTO v_is_debug_session
  FROM public.game_sessions
  WHERE id = p_session_id AND user_id = v_user_id;
  
  -- 1. ?�증 검�?
  IF v_user_id IS NULL THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Authentication required'
    );
  END IF;
  
  -- 2. 게임 모드 검�?
  IF p_game_mode NOT IN ('timeattack', 'survival') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid game mode'
    );
  END IF;
  
  -- 3. 카테고리 검�?(SQL Injection 방�?)
  IF p_category NOT IN ('math', 'english', 'logic') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid category'
    );
  END IF;
  
  -- 4. 주제 검�?(SQL Injection 방�?)
  IF p_subject NOT IN ('add', 'sub', 'mul', 'div', 'word', 'puzzle') THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid subject'
    );
  END IF;
  
  -- 5. ?�벨 검�?
  IF p_level < MIN_LEVEL OR p_level > MAX_LEVEL THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid level'
    );
  END IF;
  
  -- 6. 게임 ?�션 검�?�?멱등??처리
  DECLARE
    v_session_status TEXT;
    v_session_score INTEGER;
    v_previous_result JSONB;
  BEGIN
    SELECT status, score, result INTO v_session_status, v_session_score, v_previous_result
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    -- ?�션???�거??만료??경우
    IF v_session_status IS NULL THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session', JSONB_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Game session not found'
      );
    END IF;
    
    -- ?�️ 멱등?? ?��? ?�료???�션??경우 ?�전 결과 반환
    IF v_session_status = 'completed' THEN
      IF v_previous_result IS NOT NULL THEN
        RETURN v_previous_result;
      ELSE
        RETURN JSONB_build_object(
          'success', true,
          'message', 'This game session was already processed',
          'score', v_session_score,
          'idempotent', true
        );
      END IF;
    END IF;
    
    -- ?�션??만료??경우
    IF v_session_status = 'expired' OR 
       (SELECT expires_at FROM public.game_sessions WHERE id = p_session_id) < NOW() THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'expired_session', JSONB_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Game session expired'
      );
    END IF;
    
    -- ?�션??'playing' ?�태가 ?�닌 경우
    IF v_session_status != 'playing' THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session_status', JSONB_build_object('session_id', p_session_id, 'status', v_session_status))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Invalid session status'
      );
    END IF;
  END;
  
  -- 7. ?�트(체력) 검�?(?�버 ?�이??검�??�수) ?�️ 보안
  -- ?�️ ?�정: ?�버�??�션 체크 추�?
  DECLARE
    v_current_stamina INTEGER;
  BEGIN
    -- ?�버�??�션???�닐 ?�만 ?�태미나 검�?
    -- (v_is_debug_session?� ?�수 ?�단?�서 ?��? 조회??
    IF NOT COALESCE(v_is_debug_session, false) THEN
      SELECT stamina INTO v_current_stamina
      FROM public.profiles
      WHERE id = v_user_id;
      
      IF COALESCE(v_current_stamina, 0) <= 0 THEN
        INSERT INTO public.security_audit_log (user_id, event_type, event_data)
        VALUES (v_user_id, 'insufficient_stamina', JSONB_build_object('stamina', v_current_stamina))
        ON CONFLICT DO NOTHING;
        
        RETURN JSONB_build_object(
          'success', false, 
          'error', 'Not enough stamina'
        );
      END IF;
    ELSE
      -- ?�버�??�션: ?�태미나 검�??�킵, ?�버�?로그�?기록
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'debug_session_submit', 
              JSONB_build_object('session_id', p_session_id, 'stamina_bypassed', true))
      ON CONFLICT DO NOTHING;
    END IF;
  END;
  
  -- 8. 최소 쿨�???검�?(Rate Limit) ?�️ 보안
  DECLARE
    v_last_submit_at TIMESTAMP WITH TIME ZONE;
    v_min_cooldown_seconds INTEGER := 10;
  BEGIN
    SELECT last_game_submit_at INTO v_last_submit_at
    FROM public.profiles
    WHERE id = v_user_id;
    
    IF v_last_submit_at IS NOT NULL AND 
       (NOW() - v_last_submit_at) < (v_min_cooldown_seconds || ' seconds')::INTERVAL THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'rate_limit_exceeded', 
              JSONB_build_object('last_submit', v_last_submit_at, 'cooldown', v_min_cooldown_seconds))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Rate limit exceeded. Please wait before submitting again.'
      );
    END IF;
  END;
  
  -- 9. ?�버 ?�이??채점 (보안 ?�수) ?�️ **보안 ?�수**
  DECLARE
    v_session_questions JSONB;
    v_question JSONB;
    v_question_id UUID;
    v_user_answer INTEGER;
    v_correct_answer INTEGER;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER;
    v_question_index INTEGER;
    v_mode_weight NUMERIC := 1.0;
  BEGIN
    -- 게임 ?�션?�서 문제 ?�보 가?�오�?
    SELECT questions INTO v_session_questions
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    IF v_session_questions IS NULL THEN
      RETURN JSONB_build_object(
        'success', false,
        'error', 'Game session not found or questions missing'
      );
    END IF;
    
    -- ?�안 배열�?문제 ID 배열 길이 검�?
    IF array_length(p_user_answers, 1) != array_length(p_question_ids, 1) THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_answers', JSONB_build_object('answers_count', array_length(p_user_answers, 1), 'questions_count', array_length(p_question_ids, 1)))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false,
        'error', 'Answers and question IDs count mismatch'
      );
    END IF;
    
    -- ?�안 배열 ?�회?�며 채점
    v_total_questions := array_length(p_question_ids, 1);
    
    FOR v_question_index IN 1..v_total_questions LOOP
      v_question_id := p_question_ids[v_question_index];
      v_user_answer := p_user_answers[v_question_index];
      
      -- ?�션??questions?�서 ?�당 문제 찾기
      SELECT q INTO v_question
      FROM JSONB_array_elements(v_session_questions) AS q
      WHERE (q->>'id')::UUID = v_question_id;
      
      IF v_question IS NULL THEN
        INSERT INTO public.security_audit_log (user_id, event_type, event_data)
        VALUES (v_user_id, 'invalid_question_id', JSONB_build_object('question_id', v_question_id))
        ON CONFLICT DO NOTHING;
        
        CONTINUE;
      END IF;
      
      -- ?�답 비교
      v_correct_answer := (v_question->>'correct_answer')::INTEGER;
      
      IF v_user_answer = v_correct_answer THEN
        v_correct_count := v_correct_count + 1;
      END IF;
    END LOOP;
    
    -- ?�수 계산 (?�답�?× ?�벨�?기본 ?�수)
    -- 모드�?가중치 ?�용 (?�?�어?�과 ?�바?�벌 ?�수 ?�평???��?)
    IF p_game_mode = 'survival' THEN
      v_mode_weight := 0.8;
    ELSE
      v_mode_weight := 1.0;
    END IF;
    
    v_calculated_score := FLOOR((v_correct_count * 100.0 / GREATEST(v_total_questions, 1)) * p_level * v_mode_weight);
    
    -- ?�수 검�?
    IF v_calculated_score < 0 OR v_calculated_score > MAX_SCORE THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_score', JSONB_build_object('calculated_score', v_calculated_score))
      ON CONFLICT DO NOTHING;
      
      RETURN JSONB_build_object(
        'success', false, 
        'error', 'Invalid calculated score'
      );
    END IF;
  END;
  
  -- ?�재 마스?�리 ?�수 조회 (?�어 계산??
  SELECT total_mastery_score INTO v_total_mastery
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- ?�마 ID ?�성
  v_theme_id := p_category || '_' || p_subject;
  
  -- ?�마/모드 코드 조회
  SELECT code INTO v_theme_code
  FROM public.theme_mapping
  WHERE theme_id = v_theme_id;
  
  SELECT code INTO v_mode_code
  FROM public.mode_mapping
  WHERE mode_id = p_game_mode;
  
  IF v_theme_code IS NULL OR v_mode_code IS NULL THEN
    RETURN JSONB_build_object(
      'success', false, 
      'error', 'Invalid theme or mode'
    );
  END IF;
  
  -- 게임 ?�션 ?�료 처리 (?�사??불�?) ?�️ **보안 ?�수**
  UPDATE public.game_sessions
  SET 
    status = 'completed',
    score = v_calculated_score
  WHERE id = p_session_id;
  
  -- ?�트(체력) ?�모 (?�버?�서 처리) ?�️ 보안
  -- ?�️ ?�정: ?�버�??�션???�는 ?�태미나 ?�모 ?�킵
  -- v_is_debug_session?� ?�태미나 검�?블록?�서 ?��? 조회??
  IF NOT COALESCE(v_is_debug_session, false) THEN
    UPDATE public.profiles 
    SET 
      stamina = GREATEST(0, stamina - 1),
      last_game_submit_at = NOW()
    WHERE id = v_user_id;
  ELSE
    -- ?�버�??�션: ?�태미나 ?�모 ?�킵, last_game_submit_at�??�데?�트
    UPDATE public.profiles 
    SET 
      last_game_submit_at = NOW()
    WHERE id = v_user_id;
  END IF;
  
  -- 미네??지�?(?�버?�서 계산???�수??비�??�여 ?�동 계산) ?�️ **보안 ?�수**
  v_earned_minerals := FLOOR(v_calculated_score / MINERALS_PER_SCORE);
  v_earned_minerals := LEAST(v_earned_minerals, MAX_MINERALS);
  
  UPDATE public.profiles 
  SET minerals = minerals + v_earned_minerals
  WHERE id = v_user_id;
  
  -- ?�용???�이???�벤?�리?�서 차감
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory 
      SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;
  
  -- 주간 ?�수 ?�데?�트 (무조�??�하�? - ?�버 계산 ?�수 ?�용
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles 
    SET weekly_score_timeattack = weekly_score_timeattack + v_calculated_score,
        weekly_score_total = weekly_score_total + v_calculated_score
    WHERE id = v_user_id;
  ELSIF p_game_mode = 'survival' THEN
    UPDATE public.profiles 
    SET weekly_score_survival = weekly_score_survival + v_calculated_score,
        weekly_score_total = weekly_score_total + v_calculated_score
    WHERE id = v_user_id;
  END IF;
  
  -- 최고 기록 ?�데?�트 - ?�버 계산 ?�수 ?�용
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles 
    SET best_score_timeattack = GREATEST(best_score_timeattack, v_calculated_score)
    WHERE id = v_user_id;
  ELSIF p_game_mode = 'survival' THEN
    UPDATE public.profiles 
    SET best_score_survival = GREATEST(best_score_survival, v_calculated_score)
    WHERE id = v_user_id;
  END IF;
  
  -- 기존 최고 기록 조회 (user_level_records)
  SELECT best_score INTO v_old_best_score
  FROM public.user_level_records
  WHERE user_id = v_user_id 
    AND theme_code = v_theme_code
    AND level = p_level
    AND mode_code = v_mode_code;
  
  -- ?�기록인지 ?�인 (?�버 계산 ?�수 ?�용)
  v_new_best_score := GREATEST(COALESCE(v_old_best_score, 0), v_calculated_score);
  
  IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
    -- ?�기�? ?�수 차이만큼 마스?�리 ?�수 증�?
    v_score_diff := v_new_best_score - COALESCE(v_old_best_score, 0);
    
    -- user_level_records ?�데?�트 (UPSERT)
    INSERT INTO public.user_level_records (
      user_id, theme_code, level, mode_code, best_score
    ) VALUES (
      v_user_id, v_theme_code, p_level, v_mode_code, v_new_best_score
    )
    ON CONFLICT (user_id, theme_code, level, mode_code)
    DO UPDATE SET 
      best_score = v_new_best_score,
      updated_at = NOW();
    
    -- 마스?�리 ?�수 증�?
    UPDATE public.profiles
    SET total_mastery_score = total_mastery_score + v_score_diff
    WHERE id = v_user_id;
    
    -- ?�어 ?�데?�트 ???�재 ?�어 ?�??
    v_previous_tier := public.calculate_tier((v_total_mastery - v_score_diff)::INTEGER);
    
    -- ?�어 ?�계??�??�데?�트
    v_current_tier := public.update_user_tier(v_user_id);
    
    -- ?�어 ?�그?�이???�인
    DECLARE
      v_prev_level INTEGER := (v_previous_tier->>'level')::INTEGER;
      v_prev_stars INTEGER := (v_previous_tier->>'stars')::INTEGER;
      v_curr_level INTEGER := (v_current_tier->>'level')::INTEGER;
      v_curr_stars INTEGER := (v_current_tier->>'stars')::INTEGER;
    BEGIN
      IF v_curr_stars > v_prev_stars THEN
        v_tier_upgraded := true;
      ELSIF v_curr_stars = v_prev_stars AND v_curr_level > v_prev_level THEN
        v_tier_upgraded := true;
      END IF;
    END;
  ELSE
    -- ?�기록이 ?�니?�도 ?�재 ?�어 반환
    v_current_tier := public.calculate_tier(COALESCE(v_total_mastery, 0)::INTEGER);
  END IF;
  
  -- 강제 멈춤(Parking) ?�스?? 250,000???�달 ???�급 ?��?
  DECLARE
    v_cycle_cap INTEGER;
    v_new_total_mastery BIGINT;
  BEGIN
    SELECT value::INTEGER INTO v_cycle_cap
    FROM public.game_config
    WHERE key = 'tier_cycle_cap';
    
    IF v_cycle_cap IS NULL THEN
      v_cycle_cap := 250000;
    END IF;
    
    SELECT total_mastery_score INTO v_new_total_mastery
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- 250,000?�을 ?�었�??�재 ?�설 ?�벨??경우 ?�급 ?��??�태�??�정
    IF v_new_total_mastery >= v_cycle_cap AND 
       (v_current_tier->>'level')::INTEGER = 6 THEN
      UPDATE public.profiles
      SET
        cycle_promotion_pending = true,
        pending_cycle_score = v_new_total_mastery - v_cycle_cap
      WHERE id = v_user_id;
    END IF;
  END;
  
  -- 최종 결과 구성
  DECLARE
    v_final_result JSON;
    v_badge_result JSON;
    v_awarded_badges TEXT[];
  BEGIN
    -- 뱃�? ?�득 체크 (?�기록일 ?�만)
    IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
      v_badge_result := public.check_and_award_badges(v_user_id, p_category, p_subject, p_level);
      v_awarded_badges := ARRAY(SELECT json_array_elements_text(v_badge_result->'awarded_badges'));
    ELSE
      v_awarded_badges := ARRAY[]::TEXT[];
    END IF;
    
    v_final_result := JSONB_build_object(
      'success', true,
      'new_record', v_new_best_score > COALESCE(v_old_best_score, 0),
      'tier_upgraded', v_tier_upgraded,
      'tier_info', v_current_tier,
      'cycle_promotion_pending', COALESCE((SELECT cycle_promotion_pending FROM public.profiles WHERE id = v_user_id), false),
      'pending_cycle_score', COALESCE((SELECT pending_cycle_score FROM public.profiles WHERE id = v_user_id), 0),
      'earned_minerals', v_earned_minerals,
      'calculated_score', v_calculated_score,
      'awarded_badges', v_awarded_badges
    );
    
    -- ?�️ 멱등?? 결과�??�션???�??(?�트?�크 불안?????�요�??�??
    UPDATE public.game_sessions
    SET result = v_final_result::JSONB
    WHERE id = p_session_id;
    
    RETURN v_final_result;
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in submit_game_result: User %, Error %', v_user_id, SQLERRM;
    
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_user_id, 'system_error', JSONB_build_object('error', SQLERRM))
    ON CONFLICT DO NOTHING;
    
    RETURN JSONB_build_object(
      'success', false,
      'error', 'An error occurred. Please try again.'
    );
END;
$$;

