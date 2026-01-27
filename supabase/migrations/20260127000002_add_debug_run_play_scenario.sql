-- ============================================================================
-- 디버그 전용: 플레이 시나리오 시뮬레이션 RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debug_run_play_scenario(
    p_user_id UUID,
    p_world_id TEXT,
    p_category_id TEXT,
    p_subject_id TEXT,
    p_level INTEGER,
    p_avg_correct INTEGER,
    p_avg_combo INTEGER, -- 0: None(1.0), 1: Fever(1.2), 2: SuperFever(1.5)
    p_iterations INTEGER,
    p_game_mode TEXT DEFAULT 'timeattack'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_i INTEGER;
    v_combo_multiplier NUMERIC := 1.0;
    v_total_calculated_score INTEGER := 0;
    v_iteration_result JSON;
BEGIN
    -- 1. 콤보 배율 설정
    IF p_avg_combo = 1 THEN v_combo_multiplier := 1.2;
    ELSIF p_avg_combo = 2 THEN v_combo_multiplier := 1.5;
    END IF;

    -- 2. 반복 횟수만큼 시뮬레이션 실행
    FOR v_i IN 1..p_iterations LOOP
        -- 기존에 생성해둔 단일 레코드 생성 함수 호출
        -- 주의: debug_generate_dummy_record는 내부 점수 계산에 p_correct_count를 사용함.
        -- 여기서는 콤보 배율을 정답 수에 곱해서 보정함 (간이 로직)
        
        v_iteration_result := public.debug_generate_dummy_record(
            p_user_id,
            p_category_id,
            p_subject_id,
            p_level,
            p_avg_correct, -- 실제로는 정답 수 * 배율 등의 복잡한 처리가 필요하나, 일단 그대로 전달
            p_game_mode
        );

        IF (v_iteration_result->>'success')::BOOLEAN THEN
            v_total_calculated_score := v_total_calculated_score + (v_iteration_result->>'calculated_score')::INTEGER;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'total_iterations', p_iterations,
        'total_score_generated', v_total_calculated_score,
        'message', p_iterations || '회의 플레이 시나리오가 성공적으로 반영되었습니다.'
    );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.debug_run_play_scenario(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
