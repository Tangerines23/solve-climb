-- ============================================================================
-- 1. profiles ?�이�??�성 (Base Schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    stamina INTEGER DEFAULT 5,
    minerals INTEGER DEFAULT 0,
    last_stamina_update TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ DEFAULT now(),
    login_streak INTEGER DEFAULT 0,
    current_tier_level INTEGER DEFAULT 0,
    total_mastery_score BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Tier v2 columns
    weekly_score_total INTEGER DEFAULT 0,
    weekly_score_timeattack INTEGER DEFAULT 0,
    weekly_score_survival INTEGER DEFAULT 0,
    -- Cycle promotion columns
    cycle_promotion_pending BOOLEAN DEFAULT false,
    pending_cycle_score BIGINT DEFAULT 0
);

-- RLS Enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. updated_at ?�리�?
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 3. 보안 �??�태미나 로직
-- ============================================================================

-- ?�로???�데?�트 보안 ?�리�??�수
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS TRIGGER AS $$
BEGIN
  -- SECURITY DEFINER RPC?�서 set_config('app.bypass_profile_security','1',true) ??경우 ?�용
  IF current_setting('app.bypass_profile_security', true) = '1' THEN
    RETURN NEW;
  END IF;
  
  -- ?�라?�언??authenticated/anon) 권한?�로 직접 ?�데?�트가 ?�도??경우�?체크
  IF (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
    IF (NEW.minerals IS DISTINCT FROM OLD.minerals) OR
       (NEW.stamina IS DISTINCT FROM OLD.stamina) OR
       (NEW.total_mastery_score IS DISTINCT FROM OLD.total_mastery_score) OR
       (NEW.current_tier_level IS DISTINCT FROM OLD.current_tier_level) OR
       (NEW.pending_cycle_score IS DISTINCT FROM OLD.pending_cycle_score) OR
       (NEW.cycle_promotion_pending IS DISTINCT FROM OLD.cycle_promotion_pending) THEN
      RAISE EXCEPTION 'Direct update of sensitive profile columns is NOT allowed. Please use official game functions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_profile_update_security ON public.profiles;
CREATE TRIGGER tr_check_profile_update_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.check_profile_update_security();

-- ?�태미나 ?�복 체크
CREATE OR REPLACE FUNCTION public.check_and_recover_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_stamina INTEGER;
    v_last_update TIMESTAMPTZ;
    v_recover_amount INTEGER;
    v_max_stamina CONSTANT INTEGER := 5;
    v_interval_minutes CONSTANT INTEGER := 5;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Lock row
    SELECT stamina, last_stamina_update INTO v_current_stamina, v_last_update
    FROM public.profiles WHERE id = v_user_id FOR UPDATE;

    IF v_current_stamina < v_max_stamina THEN
        v_recover_amount := FLOOR(EXTRACT(EPOCH FROM (now() - v_last_update)) / (v_interval_minutes * 60));
        
        IF v_recover_amount > 0 THEN
            PERFORM set_config('app.bypass_profile_security', '1', true);
            UPDATE public.profiles
            SET stamina = LEAST(v_max_stamina, v_current_stamina + v_recover_amount),
                last_stamina_update = v_last_update + (v_recover_amount * (v_interval_minutes * INTERVAL '1 minute'))
            WHERE id = v_user_id;
            v_current_stamina := LEAST(v_max_stamina, v_current_stamina + v_recover_amount);
        END IF;
    END IF;

    RETURN JSONB_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

-- ?�태미나 ?�모
CREATE OR REPLACE FUNCTION public.consume_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_current_stamina INTEGER;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- ?�복 체크
    PERFORM public.check_and_recover_stamina();

    -- Lock row
    SELECT stamina INTO v_current_stamina FROM public.profiles WHERE id = v_user_id FOR UPDATE;

    IF v_current_stamina > 0 THEN
        PERFORM set_config('app.bypass_profile_security', '1', true);
        UPDATE public.profiles
        SET stamina = stamina - 1,
            last_stamina_update = CASE WHEN stamina = 5 THEN now() ELSE last_stamina_update END
        WHERE id = v_user_id;
        RETURN JSONB_build_object('success', true, 'stamina', v_current_stamina - 1);
    END IF;

    RETURN JSONB_build_object('success', false, 'stamina', 0, 'is_exhausted', true);
END;
$$;

-- 미네??추�? (보상??
CREATE OR REPLACE FUNCTION public.add_minerals(p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_new_amount INTEGER;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    PERFORM set_config('app.bypass_profile_security', '1', true);
    UPDATE public.profiles
    SET minerals = GREATEST(0, minerals + p_amount),
        updated_at = now()
    WHERE id = v_user_id
    RETURNING minerals INTO v_new_amount;

    RETURN JSONB_build_object('success', true, 'minerals', v_new_amount);
END;
$$;

-- ?�이???�용
CREATE OR REPLACE FUNCTION public.consume_item(p_item_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_quantity INTEGER;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- ?�벤?�리?�서 ?�이???�인 �?차감
    UPDATE public.inventory
    SET quantity = quantity - 1
    WHERE user_id = v_user_id AND item_id = p_item_id AND quantity > 0
    RETURNING quantity INTO v_quantity;

    IF NOT FOUND THEN
        RETURN JSONB_build_object('success', false, 'message', 'Item not found or insufficient quantity');
    END IF;

    RETURN JSONB_build_object('success', true, 'new_quantity', v_quantity);
END;
$$;

-- ============================================================================
-- 4. RLS ?�책
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
