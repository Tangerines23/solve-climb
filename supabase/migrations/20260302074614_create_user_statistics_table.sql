-- Create user_statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    avg_solve_time FLOAT DEFAULT 0.0,
    last_played_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own statistics" ON public.user_statistics;
CREATE POLICY "Users can view their own statistics" 
ON public.user_statistics FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own statistics" ON public.user_statistics;
CREATE POLICY "Users can update their own statistics" 
ON public.user_statistics FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own statistics" ON public.user_statistics;
CREATE POLICY "Users can insert their own statistics" 
ON public.user_statistics FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Function to handle statistics updates
CREATE OR REPLACE FUNCTION public.update_user_game_stats(
    p_correct_count INTEGER,
    p_total_count INTEGER,
    p_time_spent FLOAT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stats RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Upsert stats
    INSERT INTO public.user_statistics (id, total_games, total_correct, total_questions, last_played_at, updated_at)
    VALUES (v_user_id, 1, p_correct_count, p_total_count, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
        total_games = user_statistics.total_games + 1,
        total_correct = user_statistics.total_correct + p_correct_count,
        total_questions = user_statistics.total_questions + p_total_count,
        avg_solve_time = CASE 
            WHEN user_statistics.total_games = 0 THEN p_time_spent 
            ELSE (user_statistics.avg_solve_time * user_statistics.total_games + p_time_spent) / (user_statistics.total_games + 1) 
        END,
        last_played_at = NOW(),
        updated_at = NOW();

    SELECT * INTO v_stats FROM public.user_statistics WHERE id = v_user_id;
    
    RETURN jsonb_build_object(
        'total_games', v_stats.total_games,
        'total_correct', v_stats.total_correct,
        'total_questions', v_stats.total_questions,
        'avg_solve_time', v_stats.avg_solve_time
    );
END;
$$;

-- RPC to get user stats
CREATE OR REPLACE FUNCTION public.get_user_game_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stats RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_stats FROM public.user_statistics WHERE id = v_user_id;
    
    IF NOT FOUND THEN
        -- Initialize empty stats if not exists
        INSERT INTO public.user_statistics (id) VALUES (v_user_id) RETURNING * INTO v_stats;
    END IF;

    RETURN jsonb_build_object(
        'total_games', v_stats.total_games,
        'total_correct', v_stats.total_correct,
        'total_questions', v_stats.total_questions,
        'best_streak', v_stats.best_streak,
        'avg_solve_time', v_stats.avg_solve_time,
        'last_played_at', v_stats.last_played_at
    );
END;
$$;
