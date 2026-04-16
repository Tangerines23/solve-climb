-- Restore missing debug RPCs with hardening
-- Date: 2026-04-11

-- 1. debug_set_stamina
DROP FUNCTION IF EXISTS public.debug_set_stamina(INTEGER);
CREATE OR REPLACE FUNCTION public.debug_set_stamina(p_stamina INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- Security bypass for profile trigger
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  -- Check debug mode
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  UPDATE public.profiles
  SET stamina = p_stamina,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN JSONB_build_object('success', true, 'message', 'Stamina updated to ' || p_stamina);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. debug_set_minerals
DROP FUNCTION IF EXISTS public.debug_set_minerals(INTEGER);
CREATE OR REPLACE FUNCTION public.debug_set_minerals(p_minerals INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_dev BOOLEAN;
BEGIN
  -- Security bypass
  PERFORM pg_catalog.set_config('app.bypass_profile_security', '1', true);

  -- Check debug mode
  SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
  FROM public.game_config
  WHERE key = 'debug_mode_enabled';
  
  IF NOT v_is_dev THEN
    RAISE EXCEPTION 'Debug functions are disabled in production';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  UPDATE public.profiles
  SET minerals = p_minerals,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN JSONB_build_object('success', true, 'message', 'Minerals updated to ' || p_minerals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. debug_set_inventory_quantity
DROP FUNCTION IF EXISTS public.debug_set_inventory_quantity(UUID, INT, INT);
CREATE OR REPLACE FUNCTION public.debug_set_inventory_quantity(
    p_user_id UUID,
    p_item_id INT,
    p_quantity INT
)
RETURNS JSONB AS $$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Debug functions are disabled in production';
    END IF;

    IF p_quantity <= 0 THEN
        DELETE FROM public.inventory
        WHERE user_id = p_user_id AND item_id = p_item_id;
    ELSE
        INSERT INTO public.inventory (user_id, item_id, quantity)
        VALUES (p_user_id, p_item_id, p_quantity)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
    END IF;

    RETURN JSONB_build_object('success', true, 'message', 'Inventory updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. debug_reset_inventory
DROP FUNCTION IF EXISTS public.debug_reset_inventory(UUID);
CREATE OR REPLACE FUNCTION public.debug_reset_inventory(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_is_dev BOOLEAN;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Debug functions are disabled in production';
    END IF;

    DELETE FROM public.inventory
    WHERE user_id = p_user_id;

    RETURN JSONB_build_object('success', true, 'message', 'Inventory reset');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. debug_grant_items
DROP FUNCTION IF EXISTS public.debug_grant_items();
CREATE OR REPLACE FUNCTION public.debug_grant_items()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_dev BOOLEAN;
    v_item_record RECORD;
BEGIN
    SELECT COALESCE((value::BOOLEAN), false) INTO v_is_dev
    FROM public.game_config
    WHERE key = 'debug_mode_enabled';
    
    IF NOT v_is_dev THEN
        RAISE EXCEPTION 'Debug functions are disabled in production';
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Grant 10 of each item
    FOR v_item_record IN SELECT id FROM public.items LOOP
        INSERT INTO public.inventory (user_id, item_id, quantity)
        VALUES (v_user_id, v_item_record.id, 10)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = inventory.quantity + 10, updated_at = NOW();
    END LOOP;

    RETURN JSONB_build_object('success', true, 'message', 'All items granted (10 each)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Grants
GRANT EXECUTE ON FUNCTION public.debug_set_stamina(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_minerals(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_set_inventory_quantity(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_reset_inventory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_grant_items() TO authenticated;
