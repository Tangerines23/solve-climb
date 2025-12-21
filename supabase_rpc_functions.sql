-- Supabase RPC 함수 모음

-- 1. 아이템 구매 함수
CREATE OR REPLACE FUNCTION purchase_item(p_item_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_price INTEGER;
  v_minerals INTEGER;
BEGIN
  -- 아이템 가격 조회
  SELECT price INTO v_price FROM public.items WHERE id = p_item_id;
  IF v_price IS NULL THEN
    RETURN json_build_object('success', false, 'message', '아이템을 찾을 수 없습니다.');
  END IF;

  -- 유저 미네랄 확인
  SELECT minerals INTO v_minerals FROM public.profiles WHERE id = v_user_id;
  IF v_minerals < v_price THEN
    RETURN json_build_object('success', false, 'message', '미네랄이 부족합니다.');
  END IF;

  -- 미네랄 차감
  UPDATE public.profiles SET minerals = minerals - v_price WHERE id = v_user_id;

  -- 인벤토리 추가 (UPSERT)
  INSERT INTO public.inventory (user_id, item_id, quantity)
  VALUES (v_user_id, p_item_id, 1)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = inventory.quantity + 1;

  RETURN json_build_object('success', true, 'message', '구매 완료');
END;
$$;

-- 2. 게임 결과 제출 함수
CREATE OR REPLACE FUNCTION submit_game_result(
  p_score INTEGER,
  p_minerals_earned INTEGER,
  p_game_mode TEXT,
  p_items_used INTEGER[] -- 소모된 아이템 ID 배열
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_id INTEGER;
BEGIN
  -- 1. 미네랄 지급
  UPDATE public.profiles 
  SET minerals = minerals + p_minerals_earned
  WHERE id = v_user_id;

  -- 2. 사용된 아이템 인벤토리에서 차감
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory 
      SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;

  -- 3. 최고 점수 갱신
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles 
    SET best_score_timeattack = GREATEST(best_score_timeattack, p_score)
    WHERE id = v_user_id;
  ELSIF p_game_mode = 'survival' THEN
    UPDATE public.profiles 
    SET best_score_survival = GREATEST(best_score_survival, p_score)
    WHERE id = v_user_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- 3. 스태미나 회복 및 체크 함수
CREATE OR REPLACE FUNCTION check_and_recover_stamina()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_stamina INTEGER;
  v_last_update TIMESTAMP WITH TIME ZONE;
  v_recover_amount INTEGER;
  v_intervals_passed INTEGER;
  v_interval_minutes INTEGER := 30; -- 회복 주기 (30분)
  v_max_stamina INTEGER := 5;
BEGIN
  SELECT stamina, last_stamina_update INTO v_current_stamina, v_last_update 
  FROM public.profiles WHERE id = v_user_id;

  IF v_current_stamina >= v_max_stamina THEN
    RETURN json_build_object('stamina', v_current_stamina);
  END IF;

  -- 경과 시간 계산
  v_intervals_passed := floor(extract(epoch from (now() - v_last_update)) / (v_interval_minutes * 60));

  IF v_intervals_passed > 0 THEN
    v_recover_amount := LEAST(v_max_stamina - v_current_stamina, v_intervals_passed);
    
    UPDATE public.profiles 
    SET 
      stamina = stamina + v_recover_amount,
      last_stamina_update = v_last_update + (v_intervals_passed * interval '30 minutes')
    WHERE id = v_user_id;
    
    v_current_stamina := v_current_stamina + v_recover_amount;
  END IF;

  RETURN json_build_object('stamina', v_current_stamina);
END;
$$;

-- 4. 스태미나 차감 함수
CREATE OR REPLACE FUNCTION consume_stamina()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_stamina INTEGER;
  v_max_stamina INTEGER := 5;
BEGIN
  SELECT stamina INTO v_current_stamina FROM public.profiles WHERE id = v_user_id;

  IF v_current_stamina <= 0 THEN
    RETURN json_build_object('success', false, 'message', '스태미나가 부족합니다.');
  END IF;

  -- 스태미나 차감 및 시간 업데이트 (풀 상태에서 소모할 때만 현재 시간으로 갱신)
  UPDATE public.profiles 
  SET 
    stamina = stamina - 1,
    last_stamina_update = CASE 
      WHEN stamina = v_max_stamina THEN now() 
      ELSE last_stamina_update 
    END
  WHERE id = v_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 5. 아이템 소모 함수 (추가됨)
CREATE OR REPLACE FUNCTION consume_item(p_item_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_quantity INTEGER;
BEGIN
  -- 인벤토리에서 아이템 수량 확인
  SELECT quantity INTO v_quantity 
  FROM public.inventory 
  WHERE user_id = v_user_id AND item_id = p_item_id;

  IF v_quantity IS NULL OR v_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'message', '아이템이 부족합니다.');
  END IF;

  -- 수량 1 차감
  UPDATE public.inventory 
  SET quantity = quantity - 1
  WHERE user_id = v_user_id AND item_id = p_item_id;

  RETURN json_build_object('success', true, 'message', '아이템 사용 완료');
END;
$$;
