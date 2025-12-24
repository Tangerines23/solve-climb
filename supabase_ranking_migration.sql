-- 1. profiles 테이블에 닉네임 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. 닉네임 업데이트 함수
CREATE OR REPLACE FUNCTION update_profile_nickname(p_nickname TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  UPDATE public.profiles
  SET nickname = p_nickname, updated_at = now()
  WHERE id = v_user_id;
  
  -- 프로필이 없으면 생성 (방어 로직)
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, nickname)
    VALUES (v_user_id, p_nickname);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- 3. 리더보드 조회 함수
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
    COALESCE(p.nickname, '알 수 없음') as nickname,
    CASE 
      WHEN p_mode = 'time-attack' THEN best_score_timeattack 
      WHEN p_mode = 'survival' THEN best_score_survival 
      ELSE 0 
    END as score,
    p.id as user_id
  FROM public.profiles p
  WHERE 
    CASE 
      WHEN p_mode = 'time-attack' THEN best_score_timeattack > 0
      WHEN p_mode = 'survival' THEN best_score_survival > 0
      ELSE false
    END
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;
