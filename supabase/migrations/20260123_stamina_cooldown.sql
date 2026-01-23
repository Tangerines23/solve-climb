-- stamina_cooldown_update.sql
-- 1. last_ad_stamina_recharge 컬럼 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_ad_stamina_recharge TIMESTAMPTZ;

-- 2. 광고 시청 후 스태미나 회복 함수 수정 (6시간 쿨타임 + 풀 충전)
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

    -- 1. 쿨타임 체크
    IF v_last_recharge IS NOT NULL AND (NOW() - v_last_recharge) < (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', '아직 충전할 수 없습니다.', 
            'remaining_minutes', CEIL(EXTRACT(EPOCH FROM ((v_last_recharge + (v_cooldown_hours * INTERVAL '1 hour')) - NOW())) / 60)
        );
    END IF;

    -- 2. 풀 충전 (5)
    UPDATE public.profiles
    SET stamina = v_max_stamina,
        last_ad_stamina_recharge = NOW(),
        last_stamina_update = NOW() -- 자연 회복 타이머도 리셋 (풀 충전이므로)
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'stamina', v_max_stamina,
        'message', '산소통이 가득 채워졌습니다! 🫧'
    );
END;
$$;
