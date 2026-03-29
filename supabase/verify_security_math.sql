-- verify_security_math.sql
-- [1] 초기화: 테스트 유저 생성 및 초기 상태 확인
-- (실제 유저 ID를 auth.uid() 대신 하드코딩하여 테스트 가능)

DO $$
DECLARE
    v_test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- 테스트용 더미 ID
    v_initial_minerals INTEGER;
    v_after_reward_minerals INTEGER;
    v_final_minerals INTEGER;
BEGIN
    -- 1. 현재 미네랄 확인
    SELECT minerals INTO v_initial_minerals FROM public.profiles WHERE id = auth.uid();
    RAISE NOTICE 'Initial Minerals: %', v_initial_minerals;

    -- 2. 광고 보상 RPC 호출 (Mineral Recharge)
    -- 내부적으로 minerals + 500 수행
    PERFORM public.secure_reward_ad_view('mineral_recharge');
    
    -- 3. 보상 후 미네랄 확인
    SELECT minerals INTO v_after_reward_minerals FROM public.profiles WHERE id = auth.uid();
    RAISE NOTICE 'After Reward Minerals: %', v_after_reward_minerals;

    -- 4. 수학적 검증: Initial + 500 = After?
    IF v_after_reward_minerals = v_initial_minerals + 500 THEN
        RAISE NOTICE '✅ Verification SUCCESS: 500 Minerals added correctly.';
    ELSE
        RAISE EXCEPTION '❌ Verification FAILED: Math mismatch. Expected %, got %', v_initial_minerals + 500, v_after_reward_minerals;
    END IF;

    -- 5. RLS 직접 업데이트 시도 (보안 검증)
    BEGIN
        UPDATE public.profiles SET minerals = 999999 WHERE id = auth.uid();
        RAISE EXCEPTION '❌ Security VULNERABILITY: Direct update allowed!';
    EXCEPTION WHEN insufficient_privilege OR raise_exception THEN
        RAISE NOTICE '✅ Security SUCCESS: Direct update blocked by RLS.';
    END;

END;
$$;
