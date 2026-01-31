-- ============================================================================
-- submit_game_result 오버로드 1 제거 (PostgREST 404 해결)
-- 작성일: 2026.01.31
-- 원인: (integer[], uuid[]) 시그니처와 (jsonb, text[]) 시그니처 2개 존재 시
--       클라이언트 호출 시 PostgREST가 매칭 실패. (jsonb, text[], p_world_id) 버전만 유지.
-- ============================================================================

DROP FUNCTION IF EXISTS public.submit_game_result(
  p_user_answers integer[],
  p_question_ids uuid[],
  p_game_mode text,
  p_items_used integer[],
  p_session_id uuid,
  p_category text,
  p_subject text,
  p_level integer,
  p_total_time_ms integer
);
