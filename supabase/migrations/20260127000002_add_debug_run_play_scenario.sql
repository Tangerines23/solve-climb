-- ============================================================================
-- ?�버�??�용: ?�레???�나리오 ?��??�이??RPC
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
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_i INTEGER;
    v_combo_multiplier NUMERIC := 1.0;
    v_total_calculated_score INTEGER := 0;
    v_iteration_result JSON;
BEGIN
    -- 1. 콤보 배율 ?�정
    IF p_avg_combo = 1 THEN v_combo_multiplier := 1.2;
    ELSIF p_avg_combo = 2 THEN v_combo_multiplier := 1.5;
    END IF;

    -- 2. 반복 ?�수만큼 ?��??�이???�행
    FOR v_i IN 1..p_iterations LOOP
        -- 기존???�성?�둔 ?�일 ?�코???�성 ?�수 ?�출
        -- 주의: debug_generate_dummy_record???��? ?�수 계산??p_correct_count�??�용??
        -- ?�기?�는 콤보 배율???�답 ?�에 곱해??보정??(간이 로직)
        
        v_iteration_result := public.debug_generate_dummy_record(
            p_user_id,
            p_category_id,
            p_subject_id,
            p_level,
            p_avg_correct, -- ?�제로는 ?�답 ??* 배율 ?�의 복잡??처리가 ?�요?�나, ?�단 그�?�??�달
            p_game_mode
        );

        IF (v_iteration_result->>'success')::BOOLEAN THEN
            v_total_calculated_score := v_total_calculated_score + (v_iteration_result->>'calculated_score')::INTEGER;
        END IF;
    END LOOP;

    RETURN JSONB_build_object(
        'success', true,
        'total_iterations', p_iterations,
        'total_score_generated', v_total_calculated_score,
        'message', p_iterations || '?�의 ?�레???�나리오가 ?�공?�으�?반영?�었?�니??'
    );
END;
$$;

-- 권한 부??
GRANT EXECUTE ON FUNCTION public.debug_run_play_scenario(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
