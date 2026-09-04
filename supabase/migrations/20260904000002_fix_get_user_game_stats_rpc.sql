-- Migration: 20260904000002_fix_get_user_game_stats_rpc.sql
-- Description:
-- 1. Fix get_user_game_stats RPC to return JSONB response instead of raising exception when unauthenticated
-- 2. Prevent HTTP 400 Bad Request on login/mypage for unauthenticated or anonymous sessions
-- 3. Support optional p_user_id parameter for flexible querying
-- 4. Prevent "record v_stats is not assigned yet" error and handle missing user_statistics safely

DROP FUNCTION IF EXISTS public.get_user_game_stats();
DROP FUNCTION IF EXISTS public.get_user_game_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_user_game_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := COALESCE(auth.uid(), p_user_id);
    v_total_games INTEGER := 0;
    v_total_correct INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_best_streak INTEGER := 0;
    v_avg_solve_time FLOAT := 0.0;
    v_last_played_at TIMESTAMPTZ := NULL;
    v_found BOOLEAN := false;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'message', 'Not authenticated',
            'total_games', 0,
            'total_correct', 0,
            'total_questions', 0,
            'best_streak', 0,
            'avg_solve_time', 0.0,
            'last_played_at', NULL
        );
    END IF;

    SELECT total_games, total_correct, total_questions, best_streak, avg_solve_time, last_played_at
    INTO v_total_games, v_total_correct, v_total_questions, v_best_streak, v_avg_solve_time, v_last_played_at
    FROM public.user_statistics 
    WHERE id = v_user_id;
    
    v_found := FOUND;

    IF NOT v_found THEN
        BEGIN
            INSERT INTO public.user_statistics (id) 
            VALUES (v_user_id) 
            RETURNING total_games, total_correct, total_questions, best_streak, avg_solve_time, last_played_at
            INTO v_total_games, v_total_correct, v_total_questions, v_best_streak, v_avg_solve_time, v_last_played_at;
        EXCEPTION WHEN OTHERS THEN
            -- user_statistics 외래키(auth.users) 제약조건 실패 또는 기타 예외 시 기본값 유지
            v_total_games := 0;
            v_total_correct := 0;
            v_total_questions := 0;
            v_best_streak := 0;
            v_avg_solve_time := 0.0;
            v_last_played_at := NULL;
        END;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'total_games', COALESCE(v_total_games, 0),
        'total_correct', COALESCE(v_total_correct, 0),
        'total_questions', COALESCE(v_total_questions, 0),
        'best_streak', COALESCE(v_best_streak, 0),
        'avg_solve_time', COALESCE(v_avg_solve_time, 0.0),
        'last_played_at', v_last_played_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_game_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_game_stats(UUID) TO authenticated, anon;
