-- 1. Remove the poison test trigger and function
DROP TRIGGER IF EXISTS tr_poison_test ON public.profiles;
DROP FUNCTION IF EXISTS public.poison_test();

-- 2. Update the security function to allow updates from 'is_local' = false (RPC bypass)
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_local_val text;
BEGIN
  -- Check if is_local is set to false (our official RPC bypass)
  BEGIN
    is_local_val := current_setting('my.is_local', true);
  EXCEPTION WHEN OTHERS THEN
    is_local_val := 'true';
  END;

  -- If it's the official game function (RPC), allow update
  IF is_local_val = 'false' THEN
    RETURN NEW;
  END IF;

  -- NEW: Also check for session-level bypass if needed, but current_setting is more reliable
  -- For now, we strictly only allow if my.is_local = 'false'

  -- Prevent direct updates to sensitive columns from normal client calls
  IF (OLD.minerals IS DISTINCT FROM NEW.minerals) OR
     (OLD.stamina IS DISTINCT FROM NEW.stamina) OR
     (OLD.persona_type IS DISTINCT FROM NEW.persona_type) THEN
    RAISE EXCEPTION 'Direct update of sensitive profile columns is NOT allowed. Please use official game functions.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Update the purchase_item function to use the session-level bypass correctly
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id text, p_price integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_current_minerals integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Enable security bypass for this session
  -- Use 'my.' prefix for custom session variables to avoid collisions
  PERFORM set_config('my.is_local', 'false', true);

  -- Get current minerals
  SELECT minerals INTO v_current_minerals FROM public.profiles WHERE id = v_user_id;
  
  IF v_current_minerals < p_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient minerals');
  END IF;

  -- Deduct minerals (This will trigger check_profile_update_security)
  UPDATE public.profiles 
  SET minerals = minerals - p_price,
      updated_at = now()
  WHERE id = v_user_id;

  -- Add to inventory (assuming we have an inventory table and proper logic for adding items)
  -- For now, we just succeed if the mineral deduction worked.
  INSERT INTO public.inventory (user_id, item_id, quantity)
  VALUES (v_user_id, p_item_id, 1)
  ON CONFLICT (user_id, item_id) 
  DO UPDATE SET quantity = inventory.quantity + 1;

  RETURN json_build_object('success', true, 'new_minerals', v_current_minerals - p_price);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Give the first user some minerals to test
UPDATE public.profiles SET minerals = 9999 WHERE id = (SELECT id FROM auth.users LIMIT 1);
