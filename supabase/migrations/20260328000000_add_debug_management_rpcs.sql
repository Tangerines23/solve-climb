-- ============================================================================
-- 디버그 데이터 관리 RPC (Hardening)
-- 작성일: 2026.03.28
-- 목적: 클라이언트 사이드의 직접적인 DELETE 요청을 서버 측 RPC로 마이그레이션하여 보안 강화
-- ============================================================================

-- 1. 게임 기록 삭제 RPC
-- 특정 개수, 특정 레벨, 또는 전체 기록 삭제 지원
CREATE OR REPLACE FUNCTION public.debug_clear_game_records(
  p_user_id UUID,
  p_count INTEGER DEFAULT NULL,
  p_level INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
  v_deleted_sessions INTEGER := 0;
  v_session_ids UUID[];
BEGIN
  -- 1) 디버그 모드 활성화 여부 확인
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  -- 2) 인증 및 권한 확인
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 3) 삭제 대상 세션 ID 수집
  IF p_count IS NOT NULL THEN
    -- 최근 N개 세션
    SELECT array_agg(id) INTO v_session_ids
    FROM (
      SELECT id FROM public.game_sessions
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT p_count
    ) t;
  ELSIF p_level IS NOT NULL THEN
    -- 특정 레벨의 모든 세션
    SELECT array_agg(id) INTO v_session_ids
    FROM public.game_sessions
    WHERE user_id = p_user_id AND level = p_level;
  ELSE
    -- 전체 세션
    SELECT array_agg(id) INTO v_session_ids
    FROM public.game_sessions
    WHERE user_id = p_user_id;
  END IF;

  -- 4) 데이터 삭제 실행
  IF v_session_ids IS NOT NULL AND array_length(v_session_ids, 1) > 0 THEN
    -- 1. user_game_logs 삭제 (연관 데이터)
    IF p_level IS NOT NULL THEN
      DELETE FROM public.user_game_logs 
      WHERE user_id = p_user_id AND level = p_level;
    ELSIF p_count IS NOT NULL THEN
      -- 수집된 세션들 중 가장 오래된 것의 생성일 이후 로그 삭제
      DELETE FROM public.user_game_logs 
      WHERE user_id = p_user_id 
        AND created_at >= (SELECT MIN(created_at) FROM public.game_sessions WHERE id = ANY(v_session_ids));
    ELSE
      DELETE FROM public.user_game_logs 
      WHERE user_id = p_user_id;
    END IF;
    
    -- 2. game_sessions 삭제
    DELETE FROM public.game_sessions WHERE id = ANY(v_session_ids);
    
    v_deleted_sessions := array_length(v_session_ids, 1);

    -- 3. 특정 레벨 삭제인 경우 user_level_records 기록도 초기화
    IF p_level IS NOT NULL THEN
      DELETE FROM public.user_level_records 
      WHERE user_id = p_user_id AND level = p_level;
    END IF;
  END IF;

  RETURN JSONB_build_object(
    'success', true, 
    'deleted_sessions', COALESCE(v_deleted_sessions, 0),
    'message', 'Game records cleared successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 레벨 진행도 초기화 RPC
-- 특정 카테고리/주제의 모든 진행 기록 삭제
CREATE OR REPLACE FUNCTION public.debug_reset_level_progress(
  p_user_id UUID,
  p_category_id TEXT,
  p_subject_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_authenticated_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- 1) 디버그 모드 활성화 여부 확인
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  -- 2) 인증 및 권한 확인
  IF v_authenticated_user_id IS NULL OR p_user_id != v_authenticated_user_id THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 3) user_level_records 삭제
  DELETE FROM public.user_level_records
  WHERE user_id = p_user_id 
    AND category = p_category_id 
    AND subject = p_subject_id;

  RETURN JSONB_build_object(
    'success', true, 
    'message', 'Level progress reset successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
