-- db lint 경고 ?�결: debug_run_play_scenario??v_res 미사??변???�거
-- v_res??debug_generate_dummy_record 반환값을 ?�?�만 ?�고 ?�용?��? ?�음 ??PERFORM�?변�?

CREATE OR REPLACE FUNCTION public.debug_run_play_scenario(
    p_user_id UUID,
    p_world_id TEXT,
    p_category TEXT,
    p_subject TEXT,
    p_level_start INTEGER,
    p_level_end INTEGER,
    p_accuracy NUMERIC DEFAULT 0.8
)
RETURNS JSONB AS $$
DECLARE
    v_correct_count INTEGER;
    v_total_generated INTEGER := 0;
BEGIN
    FOR i IN p_level_start..p_level_end LOOP
        v_correct_count := FLOOR(10 * p_accuracy);

        PERFORM public.debug_generate_dummy_record(
            p_user_id,
            p_world_id,
            p_category,
            p_subject,
            i,
            v_correct_count,
            'survival'
        );

        v_total_generated := v_total_generated + 1;
    END LOOP;

    PERFORM public.check_and_award_badges(p_user_id);

    RETURN JSONB_build_object(
        'success', true,
        'levels_generated', v_total_generated,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
