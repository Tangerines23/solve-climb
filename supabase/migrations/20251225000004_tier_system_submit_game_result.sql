-- ============================================================================
-- 티어 시스템 submit_game_result 함수 (서버 사이드 채점 포함)
-- 작성일: 2025.12.25
-- ============================================================================

-- 기존 submit_game_result 함수 교체
CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_user_answers INTEGER[],  -- 유저가 선택한 답안 배열 (예: [1, 3, 2, 4]) ⚠️ **보안 필수**
  p_question_ids UUID[],      -- 어떤 문제였는지 (세션의 questions와 매칭) ⚠️ **보안 필수**
  p_game_mode TEXT,
  p_items_used INTEGER[],
  p_session_id UUID,  -- 게임 세션 ID (재전송 공격 방지) ⚠️ **보안 필수**
  p_category TEXT DEFAULT 'math',
  p_subject TEXT DEFAULT 'add',
  p_level INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_id INTEGER;
  v_old_best_score INTEGER;
  v_new_best_score INTEGER;
  v_score_diff INTEGER;
  v_calculated_score INTEGER := 0;  -- 서버에서 계산한 점수 ⚠️ **보안 필수**
  v_earned_minerals INTEGER := 0;
  v_theme_id TEXT;
  v_previous_tier JSON;
  v_current_tier JSON;
  v_tier_upgraded BOOLEAN := false;
  v_total_mastery BIGINT;
  v_theme_code SMALLINT;
  v_mode_code SMALLINT;
  -- 검증 상수
  MAX_SCORE INTEGER := 1000000;
  MAX_MINERALS INTEGER := 10000;
  MAX_LEVEL INTEGER := 100;
  MIN_LEVEL INTEGER := 1;
  MINERALS_PER_SCORE INTEGER := 100;  -- 점수 100당 미네랄 1개
BEGIN
  -- 1. 인증 검증
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Authentication required'
    );
  END IF;
  
  -- 2. 게임 모드 검증
  IF p_game_mode NOT IN ('timeattack', 'survival') THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid game mode'
    );
  END IF;
  
  -- 3. 카테고리 검증 (SQL Injection 방지)
  IF p_category NOT IN ('math', 'english', 'logic') THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid category'
    );
  END IF;
  
  -- 4. 주제 검증 (SQL Injection 방지)
  IF p_subject NOT IN ('add', 'sub', 'mul', 'div', 'word', 'puzzle') THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid subject'
    );
  END IF;
  
  -- 5. 레벨 검증
  IF p_level < MIN_LEVEL OR p_level > MAX_LEVEL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid level'
    );
  END IF;
  
  -- 6. 게임 세션 검증 및 멱등성 처리
  DECLARE
    v_session_status TEXT;
    v_session_score INTEGER;
    v_previous_result JSONB;
  BEGIN
    SELECT status, score, result INTO v_session_status, v_session_score, v_previous_result
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    -- 세션이 없거나 만료된 경우
    IF v_session_status IS NULL THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session', json_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Game session not found'
      );
    END IF;
    
    -- ⚠️ 멱등성: 이미 완료된 세션인 경우 이전 결과 반환
    IF v_session_status = 'completed' THEN
      IF v_previous_result IS NOT NULL THEN
        RETURN v_previous_result;
      ELSE
        RETURN json_build_object(
          'success', true,
          'message', 'This game session was already processed',
          'score', v_session_score,
          'idempotent', true
        );
      END IF;
    END IF;
    
    -- 세션이 만료된 경우
    IF v_session_status = 'expired' OR 
       (SELECT expires_at FROM public.game_sessions WHERE id = p_session_id) < NOW() THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'expired_session', json_build_object('session_id', p_session_id))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Game session expired'
      );
    END IF;
    
    -- 세션이 'playing' 상태가 아닌 경우
    IF v_session_status != 'playing' THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_session_status', json_build_object('session_id', p_session_id, 'status', v_session_status))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Invalid session status'
      );
    END IF;
  END;
  
  -- 7. 하트(체력) 검증 (서버 사이드 검증 필수) ⚠️ 보안
  DECLARE
    v_current_stamina INTEGER;
  BEGIN
    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id;
    
    IF COALESCE(v_current_stamina, 0) <= 0 THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'insufficient_stamina', json_build_object('stamina', v_current_stamina))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Not enough stamina'
      );
    END IF;
  END;
  
  -- 8. 최소 쿨타임 검증 (Rate Limit) ⚠️ 보안
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
              json_build_object('last_submit', v_last_submit_at, 'cooldown', v_min_cooldown_seconds))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Rate limit exceeded. Please wait before submitting again.'
      );
    END IF;
  END;
  
  -- 9. 서버 사이드 채점 (보안 필수) ⚠️ **보안 필수**
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
    -- 게임 세션에서 문제 정보 가져오기
    SELECT questions INTO v_session_questions
    FROM public.game_sessions
    WHERE id = p_session_id AND user_id = v_user_id;
    
    IF v_session_questions IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Game session not found or questions missing'
      );
    END IF;
    
    -- 답안 배열과 문제 ID 배열 길이 검증
    IF array_length(p_user_answers, 1) != array_length(p_question_ids, 1) THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_answers', json_build_object('answers_count', array_length(p_user_answers, 1), 'questions_count', array_length(p_question_ids, 1)))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false,
        'error', 'Answers and question IDs count mismatch'
      );
    END IF;
    
    -- 답안 배열 순회하며 채점
    v_total_questions := array_length(p_question_ids, 1);
    
    FOR v_question_index IN 1..v_total_questions LOOP
      v_question_id := p_question_ids[v_question_index];
      v_user_answer := p_user_answers[v_question_index];
      
      -- 세션의 questions에서 해당 문제 찾기
      SELECT q INTO v_question
      FROM jsonb_array_elements(v_session_questions) AS q
      WHERE (q->>'id')::UUID = v_question_id;
      
      IF v_question IS NULL THEN
        INSERT INTO public.security_audit_log (user_id, event_type, event_data)
        VALUES (v_user_id, 'invalid_question_id', json_build_object('question_id', v_question_id))
        ON CONFLICT DO NOTHING;
        
        CONTINUE;
      END IF;
      
      -- 정답 비교
      v_correct_answer := (v_question->>'correct_answer')::INTEGER;
      
      IF v_user_answer = v_correct_answer THEN
        v_correct_count := v_correct_count + 1;
      END IF;
    END LOOP;
    
    -- 점수 계산 (정답률 × 레벨별 기본 점수)
    -- 모드별 가중치 적용 (타임어택과 서바이벌 점수 형평성 유지)
    IF p_game_mode = 'survival' THEN
      v_mode_weight := 0.8;  -- 서바이벌 점수 20% 감소 (예시, 실제 값은 밸런스 테스트 후 결정)
    ELSE
      v_mode_weight := 1.0;  -- 타임어택은 기준점
    END IF;
    
    v_calculated_score := FLOOR((v_correct_count * 100.0 / GREATEST(v_total_questions, 1)) * p_level * v_mode_weight);
    
    -- 점수 검증
    IF v_calculated_score < 0 OR v_calculated_score > MAX_SCORE THEN
      INSERT INTO public.security_audit_log (user_id, event_type, event_data)
      VALUES (v_user_id, 'invalid_score', json_build_object('calculated_score', v_calculated_score))
      ON CONFLICT DO NOTHING;
      
      RETURN json_build_object(
        'success', false, 
        'error', 'Invalid calculated score'
      );
    END IF;
  END;
  
  -- 현재 마스터리 점수 조회 (티어 계산용)
  SELECT total_mastery_score INTO v_total_mastery
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- 테마 ID 생성
  v_theme_id := p_category || '_' || p_subject;
  
  -- 테마/모드 코드 조회
  SELECT code INTO v_theme_code
  FROM public.theme_mapping
  WHERE theme_id = v_theme_id;
  
  SELECT code INTO v_mode_code
  FROM public.mode_mapping
  WHERE mode_id = p_game_mode;
  
  IF v_theme_code IS NULL OR v_mode_code IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid theme or mode'
    );
  END IF;
  
  -- 게임 세션 완료 처리 (재사용 불가) ⚠️ **보안 필수**
  UPDATE public.game_sessions
  SET 
    status = 'completed',
    score = v_calculated_score
  WHERE id = p_session_id;
  
  -- 하트(체력) 소모 (서버에서 처리) ⚠️ 보안
  UPDATE public.profiles 
  SET 
    stamina = GREATEST(0, stamina - 1),
    last_game_submit_at = NOW()
  WHERE id = v_user_id;
  
  -- 미네랄 지급 (서버에서 계산된 점수에 비례하여 자동 계산) ⚠️ **보안 필수**
  v_earned_minerals := FLOOR(v_calculated_score / MINERALS_PER_SCORE);
  v_earned_minerals := LEAST(v_earned_minerals, MAX_MINERALS);
  
  UPDATE public.profiles 
  SET minerals = minerals + v_earned_minerals
  WHERE id = v_user_id;
  
  -- 사용된 아이템 인벤토리에서 차감
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory 
      SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;
  
  -- 주간 점수 업데이트 (무조건 더하기) - 서버 계산 점수 사용
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
  
  -- 최고 기록 업데이트 - 서버 계산 점수 사용
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
  
  -- 신기록인지 확인 (서버 계산 점수 사용)
  v_new_best_score := GREATEST(COALESCE(v_old_best_score, 0), v_calculated_score);
  
  IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
    -- 신기록! 점수 차이만큼 마스터리 점수 증가
    v_score_diff := v_new_best_score - COALESCE(v_old_best_score, 0);
    
    -- user_level_records 업데이트 (UPSERT)
    INSERT INTO public.user_level_records (
      user_id, theme_code, level, mode_code, best_score
    ) VALUES (
      v_user_id, v_theme_code, p_level, v_mode_code, v_new_best_score
    )
    ON CONFLICT (user_id, theme_code, level, mode_code)
    DO UPDATE SET 
      best_score = v_new_best_score,
      updated_at = NOW();
    
    -- 마스터리 점수 증가
    UPDATE public.profiles
    SET total_mastery_score = total_mastery_score + v_score_diff
    WHERE id = v_user_id;
    
    -- 티어 업데이트 전 현재 티어 저장
    v_previous_tier := public.calculate_tier((v_total_mastery - v_score_diff)::INTEGER);
    
    -- 티어 재계산 및 업데이트
    v_current_tier := public.update_user_tier(v_user_id);
    
    -- 티어 업그레이드 확인
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
    -- 신기록이 아니어도 현재 티어 반환
    v_current_tier := public.calculate_tier(COALESCE(v_total_mastery, 0)::INTEGER);
  END IF;
  
  -- 강제 멈춤(Parking) 시스템: 250,000점 도달 시 승급 대기
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
    
    -- 250,000점을 넘었고 현재 전설 레벨인 경우 승급 대기 상태로 설정
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
    -- 뱃지 획득 체크 (신기록일 때만)
    IF v_new_best_score > COALESCE(v_old_best_score, 0) THEN
      v_badge_result := public.check_and_award_badges(v_user_id, p_category, p_subject, p_level);
      v_awarded_badges := ARRAY(SELECT json_array_elements_text(v_badge_result->'awarded_badges'));
    ELSE
      v_awarded_badges := ARRAY[]::TEXT[];
    END IF;
    
    v_final_result := json_build_object(
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
    
    -- ⚠️ 멱등성: 결과를 세션에 저장 (네트워크 불안정 시 재요청 대응)
    UPDATE public.game_sessions
    SET result = v_final_result::JSONB
    WHERE id = p_session_id;
    
    RETURN v_final_result;
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in submit_game_result: User %, Error %', v_user_id, SQLERRM;
    
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (v_user_id, 'system_error', json_build_object('error', SQLERRM))
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred. Please try again.'
    );
END;
$$;

