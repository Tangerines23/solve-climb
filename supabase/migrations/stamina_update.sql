-- 1. Stamina 컬럼 추가
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_stamina_update TIMESTAMPTZ DEFAULT NOW();

-- 2. 기존 함수 삭제 (리턴 타입 변경을 위해 필수)
DROP FUNCTION IF EXISTS check_and_recover_stamina();
DROP FUNCTION IF EXISTS consume_stamina();

-- 3. 스태미나 확인 및 회복 함수
CREATE OR REPLACE FUNCTION check_and_recover_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
    v_max_stamina CONSTANT INTEGER := 5;
    v_last_update TIMESTAMPTZ;
    v_minutes_passed INTEGER;
    v_recovered_amount INTEGER;
    v_new_stamina INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Lock the row for update
    SELECT stamina, last_stamina_update 
    INTO v_current_stamina, v_last_update
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
    END IF;

    IF v_current_stamina < v_max_stamina THEN
        v_minutes_passed := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_last_update)) / 60);
        v_recovered_amount := FLOOR(v_minutes_passed / 10);

        IF v_recovered_amount > 0 THEN
            v_new_stamina := LEAST(v_current_stamina + v_recovered_amount, v_max_stamina);
            
            IF v_new_stamina = v_max_stamina THEN
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = NOW()
                WHERE id = v_user_id;
            ELSE
                UPDATE public.profiles
                SET stamina = v_new_stamina,
                    last_stamina_update = v_last_update + (v_recovered_amount * INTERVAL '10 minutes')
                WHERE id = v_user_id;
            END IF;
            
            v_current_stamina := v_new_stamina;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina);
END;
$$;

-- 4. 스태미나 소모 함수
CREATE OR REPLACE FUNCTION consume_stamina()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_stamina > 0 THEN
        UPDATE public.profiles
        SET stamina = stamina - 1,
            last_stamina_update = CASE 
                WHEN stamina = 5 THEN NOW() 
                ELSE last_stamina_update    
            END
        WHERE id = v_user_id;
        RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina - 1);
    ELSE
        RETURN jsonb_build_object('success', true, 'stamina', 0, 'is_exhausted', true);
    END IF;
    END IF;
END;
$$;

-- 5. 광고 시청 후 스태미나 회복 함수 (1회성)
CREATE OR REPLACE FUNCTION recover_stamina_ads()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Lock row
    SELECT stamina INTO v_current_stamina
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    -- 최대치(5)가 아닌 경우에만 회복
    IF v_current_stamina < 5 THEN
        UPDATE public.profiles
        SET stamina = stamina + 1
        WHERE id = v_user_id;

        RETURN jsonb_build_object('success', true, 'stamina', v_current_stamina + 1);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Stamina is already full', 'stamina', v_current_stamina);
    END IF;
END;
$$;
