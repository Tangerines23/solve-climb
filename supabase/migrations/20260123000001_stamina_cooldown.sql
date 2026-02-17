-- stamina_cooldown_update.sql
-- 1. last_ad_stamina_recharge 컬럼 추�?
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_ad_stamina_recharge TIMESTAMPTZ;

-- 2. 광고 ?�청 ???�태미나 ?�복 ?�수 ?�정 (6?�간 쿨�???+ ?� 충전)
CREATE OR REPLACE FUNCTION recover_stamina_ads()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_stamina INTEGER;
    v_last_recharge TIMESTAMPTZ;
    v_cooldown_hours CONSTANT INTEGER := 6;
    v_max_stamina CONSTANT INTEGER := 5;
BEGIN
    v_user_id := auth.uid();
    
    -- Lock row
    SELECT stamina, last_ad_stamina_recharge 
    INTO v_current_stamina, v_last_recharge
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    -- 1. 쿨�???체크
    IF v_last_recharge IS NOT NULL AND (NOW() - v_last_recharge) < (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN JSONB_build_object(
            'success', false, 
            'message', '?�직 충전?????�습?�다.', 
            'remaining_minutes', CEIL(EXTRACT(EPOCH FROM ((v_last_recharge + (v_cooldown_hours * INTERVAL '1 hour')) - NOW())) / 60)
        );
    END IF;

    -- 2. ?� 충전 (5)
    UPDATE public.profiles
    SET stamina = v_max_stamina,
        last_ad_stamina_recharge = NOW(),
        last_stamina_update = NOW() -- ?�연 ?�복 ?�?�머??리셋 (?� 충전?��?�?
    WHERE id = v_user_id;

    RETURN JSONB_build_object(
        'success', true, 
        'stamina', v_max_stamina,
        'message', '?�소?�이 가??채워졌습?�다! ?��'
    );
END;
$$;
