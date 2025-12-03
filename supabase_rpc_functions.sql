-- Supabase RPC 함수: 사용자 게임 통계 조회
-- 이 함수를 Supabase SQL Editor에서 실행하여 함수를 생성하세요.

CREATE OR REPLACE FUNCTION get_user_game_stats()
RETURNS TABLE (
  total_height INTEGER,
  total_solved INTEGER,
  max_level INTEGER,
  best_subject TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 현재 인증된 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COALESCE(SUM(score), 0)::INTEGER as total_height,
      COUNT(*) FILTER (WHERE cleared = true)::INTEGER as total_solved,
      COALESCE(MAX(level) FILTER (WHERE cleared = true), 0)::INTEGER as max_level
    FROM game_records
    WHERE user_id = current_user_id
  ),
  subject_scores AS (
    SELECT 
      subject,
      SUM(score) as total_score
    FROM game_records
    WHERE user_id = current_user_id
    GROUP BY subject
    ORDER BY total_score DESC
    LIMIT 1
  )
  SELECT 
    us.total_height,
    us.total_solved,
    us.max_level,
    COALESCE(ss.subject, NULL)::TEXT as best_subject
  FROM user_stats us
  LEFT JOIN subject_scores ss ON true;
END;
$$;

-- RLS 정책: 사용자는 자신의 통계만 조회 가능
-- (함수가 SECURITY DEFINER로 실행되므로 RLS는 함수 내부에서 처리됨)

