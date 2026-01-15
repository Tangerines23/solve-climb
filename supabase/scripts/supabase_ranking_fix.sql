-- 리더보드 조회 함수 수정 (닉네임 없는 유저 제외)
CREATE OR REPLACE FUNCTION get_leaderboard(p_mode TEXT, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  nickname TEXT,
  score INTEGER,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    RANK() OVER (ORDER BY 
      CASE 
        WHEN p_mode = 'time-attack' THEN best_score_timeattack 
        WHEN p_mode = 'survival' THEN best_score_survival 
        ELSE 0 
      END DESC
    ) as rank,
    p.nickname, -- COALESCE 제거 (WHERE절에서 필터링하므로)
    CASE 
      WHEN p_mode = 'time-attack' THEN best_score_timeattack 
      WHEN p_mode = 'survival' THEN best_score_survival 
      ELSE 0 
    END as score,
    p.id as user_id
  FROM public.profiles p
  WHERE 
    (p.nickname IS NOT NULL AND p.nickname != '') AND -- 닉네임 있는 유저만 표시
    CASE 
      WHEN p_mode = 'time-attack' THEN best_score_timeattack > 0
      WHEN p_mode = 'survival' THEN best_score_survival > 0
      ELSE false
    END
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;
