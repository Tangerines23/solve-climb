-- ============================================================================
-- submit_game_result ?�버로드 1 ?�거 (PostgREST 404 ?�결)
-- ?�성?? 2026.01.31
-- ?�인: (integer[], uuid[]) ?�그?�처?� (JSONB, text[]) ?�그?�처 2�?존재 ??
--       ?�라?�언???�출 ??PostgREST가 매칭 ?�패. (JSONB, text[], p_world_id) 버전�??��?.
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
