-- ============================================================================
-- ?�버�??�용: 뱃�? ?�의 ?�괄 ?�치 (Seeding) RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.debug_seed_badge_definitions(
    p_badges JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한?�로 ?�행 (RLS 무시)
AS $$
DECLARE
    v_badge RECORD;
    v_count INTEGER := 0;
BEGIN
    -- ?�력??JSONB 배열???�회?�며 upsert ?�행
    FOR v_badge IN SELECT * FROM JSONB_to_recordset(p_badges) AS x(id TEXT, name TEXT, description TEXT, emoji TEXT, theme_id TEXT)
    LOOP
        INSERT INTO public.badge_definitions (id, name, description, emoji, theme_id)
        VALUES (v_badge.id, v_badge.name, v_badge.description, v_badge.emoji, v_badge.theme_id)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            emoji = EXCLUDED.emoji,
            theme_id = EXCLUDED.theme_id;
        
        v_count := v_count + 1;
    END LOOP;

    RETURN JSONB_build_object(
        'success', true,
        'message', v_count || '개의 뱃�? ?�의가 ?�치?�었?�니??'
    );
END;
$$;

-- 권한 부??
GRANT EXECUTE ON FUNCTION public.debug_seed_badge_definitions(JSONB) TO authenticated;
