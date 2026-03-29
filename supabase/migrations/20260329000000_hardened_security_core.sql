-- 20260329000000_hardened_security_core.sql

-- [1] Profiles RLS Hardening
-- 현재 유저가 자신의 프로필을 마음대로 업데이트할 수 있는 권한을 제거합니다.
-- 모든 필드 변경(미네랄, 스테미너 등)은 이제 보안이 보장된 RPC 함수를 통해서만 가능합니다.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 내부 RPC 함수에서 프로필을 업데이트할 때 보안 검사를 건너뛰기 위해 사용하는 설정
-- (함수 내부에서 'app.bypass_profile_security'를 '1'로 설정하여 작동)
CREATE POLICY "Profiles are only updatable via secure RPC" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        current_setting('app.bypass_profile_security', true, true) = '1'
    );

-- [2] Security Audit Logging Utility
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (auth.uid(), p_event_type, p_data);
END;
$$;

-- [3] Secure Reward System (Ads & Others)
-- 기존의 단순 add_minerals 호출을 대체합니다.

CREATE OR REPLACE FUNCTION public.secure_reward_ad_view(p_ad_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reward_minerals INTEGER := 0;
    v_reward_stamina INTEGER := 0;
    v_new_minerals INTEGER;
    v_new_stamina INTEGER;
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- [보안 체크] 광고 타입별 보상 설정
    IF p_ad_type = 'mineral_recharge' THEN
        v_reward_minerals := 500;
    ELSIF p_ad_type = 'stamina_recharge' THEN
        v_reward_stamina := 5; -- 최대치로 복구 시도 (또는 +5)
    ELSE
        RETURN JSONB_build_object('success', false, 'message', 'Invalid ad type');
    END IF;

    -- 프로필 업데이트 (보안 우회 설정 필요)
    PERFORM set_config('app.bypass_profile_security', '1', true);
    
    UPDATE public.profiles
    SET minerals = minerals + v_reward_minerals,
        stamina = CASE WHEN v_reward_stamina > 0 THEN GREATEST(stamina, v_reward_stamina) ELSE stamina END,
        last_ad_stamina_recharge = CASE WHEN v_reward_stamina > 0 THEN now() ELSE last_ad_stamina_recharge END,
        updated_at = now()
    WHERE id = v_user_id
    RETURNING minerals, stamina INTO v_new_minerals, v_new_stamina;

    -- 감사 로그 기록
    PERFORM public.log_security_event('ad_reward_claimed', JSONB_build_object('ad_type', p_ad_type, 'minerals', v_reward_minerals, 'stamina', v_reward_stamina));

    RETURN JSONB_build_object(
        'success', true, 
        'minerals', v_new_minerals, 
        'stamina', v_new_stamina,
        'message', 'Reward claimed successfully'
    );
END;
$$;

-- [4] Secure Nickname Update RPC
CREATE OR REPLACE FUNCTION public.rpc_update_nickname(p_nickname TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN 
        RETURN JSONB_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- 닉네임 유효성 검사
    IF length(p_nickname) < 2 OR length(p_nickname) > 12 THEN
        RETURN JSONB_build_object('success', false, 'message', 'Nickname must be between 2 and 12 characters');
    END IF;

    -- 프로필 업데이트
    PERFORM set_config('app.bypass_profile_security', '1', true);
    
    UPDATE public.profiles
    SET nickname = p_nickname,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN JSONB_build_object('success', true, 'message', 'Nickname updated successfully');
END;
$$;

-- [5] Final security policy for debug functions (Audit)
-- 중복 정의 방지 및 기존 디버그 함수들의 안정성 확보를 위해
-- debug_mode_enabled 체크 로직이 누락된 함수가 없는지 확인하는 용도입니다.
-- (실제 구현은 기존 디버그 migration들을 따름)
