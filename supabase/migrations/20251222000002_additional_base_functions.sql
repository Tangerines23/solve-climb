-- ============================================================================
-- 추�? ?�심 ?�수 �??�리�?마기그레?�션
-- ?�성?? 2025.12.22
-- 목적: 기존 ?�락???�심 ?�수(handle_new_user, get_user_id_by_toss_key ?? 복구
-- ============================================================================

-- 1. ?�규 ?��? 처리 ?�수 (Auth Trigger??
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '?�규 ?�반가'));
  RETURN NEW;
END;
$$;

-- 2. Auth Trigger ?�성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. tossUserKey�??��? ID 조회 ?�수 (Toss ?�동??
CREATE OR REPLACE FUNCTION public.get_user_id_by_toss_key(p_toss_key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE (raw_user_meta_data->>'tossUserKey') = p_toss_key
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

-- 4. ?�로???�네???�데?�트 ?�수
CREATE OR REPLACE FUNCTION public.update_profile_nickname(p_nickname TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  UPDATE public.profiles
  SET nickname = p_nickname,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, nickname)
    VALUES (v_user_id, p_nickname);
  END IF;

  RETURN JSONB_build_object('success', true);
END;
$$;

-- 5. 리더보드 조회 ?�수 (?�거???�??
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_mode TEXT, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  nickname TEXT,
  score INTEGER,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    RANK() OVER (ORDER BY 
      CASE 
        WHEN p_mode = 'time-attack' THEN weekly_score_timeattack 
        WHEN p_mode = 'survival' THEN weekly_score_survival 
        ELSE weekly_score_total 
      END DESC
    ) as rank,
    COALESCE(p.nickname, '?????�음') as nickname,
    CASE 
      WHEN p_mode = 'time-attack' THEN weekly_score_timeattack 
      WHEN p_mode = 'survival' THEN weekly_score_survival 
      ELSE weekly_score_total 
    END as score,
    p.id as user_id
  FROM public.profiles p
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;

-- 6. ?�버그용 ?�이??지�??�수
CREATE OR REPLACE FUNCTION public.debug_grant_items()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- 모든 ?�이?�을 10개씩 ?�벤?�리??추�?
  FOR v_item IN SELECT id FROM public.items LOOP
    INSERT INTO public.inventory (user_id, item_id, quantity)
    VALUES (v_user_id, v_item.id, 10)
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = inventory.quantity + 10;
  END LOOP;

  RETURN JSONB_build_object('success', true, 'message', 'All items granted (10 each)');
END;
$$;
