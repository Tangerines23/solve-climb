-- ============================================================================
-- ??�� ?�스??v2 (주간 리그 & 명예???�당)
-- ============================================================================

-- 1. profiles ?�이블에 주간 ?�수 캐싱 컬럼 추�?
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_score_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_score_timeattack INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_score_survival INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_score_timeattack INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_score_survival INTEGER DEFAULT 0;

-- 2. 게임 ?�동 로그 ?�이�??�성 (분석??
CREATE TABLE IF NOT EXISTS public.game_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    mode TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ?�덱???�성
CREATE INDEX IF NOT EXISTS idx_game_activity_user_id ON public.game_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_game_activity_created_at ON public.game_activity(created_at);

-- RLS ?�정
ALTER TABLE public.game_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activity" ON public.game_activity;
CREATE POLICY "Users can view own activity" ON public.game_activity FOR SELECT USING (auth.uid() = user_id);

-- 3. 기존 submit_game_result ?�수 ?�데?�트 (주간 ?�수 가??�?로그 기록)
CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_score INTEGER,
  p_minerals_earned INTEGER,
  p_game_mode TEXT, -- 'timeattack' ?�는 'survival'
  p_items_used INTEGER[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_id INTEGER;
BEGIN
  -- 1. 미네??지�?
  UPDATE public.profiles 
  SET minerals = minerals + p_minerals_earned
  WHERE id = v_user_id;

  -- 2. ?�용???�이???�벤?�리?�서 차감
  IF p_items_used IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY p_items_used LOOP
      UPDATE public.inventory 
      SET quantity = GREATEST(0, quantity - 1)
      WHERE user_id = v_user_id AND item_id = v_item_id;
    END LOOP;
  END IF;

  -- 3. 최고 ?�수 갱신 �?주간 ?�수 가??
  IF p_game_mode = 'timeattack' THEN
    UPDATE public.profiles 
    SET 
        best_score_timeattack = GREATEST(best_score_timeattack, p_score),
        weekly_score_timeattack = weekly_score_timeattack + p_score,
        weekly_score_total = weekly_score_total + p_score
    WHERE id = v_user_id;
  ELSIF p_game_mode = 'survival' THEN
    UPDATE public.profiles 
    SET 
        best_score_survival = GREATEST(best_score_survival, p_score),
        weekly_score_survival = weekly_score_survival + p_score,
        weekly_score_total = weekly_score_total + p_score
    WHERE id = v_user_id;
  END IF;

  -- 4. 게임 ?�동 로그 기록
  INSERT INTO public.game_activity (user_id, category, mode, score)
  VALUES (v_user_id, 'math', p_game_mode, p_score); -- ?�재 기본 카테고리??math

  RETURN JSONB_build_object('success', true);
END;
$$;

-- 4. ??�� v2 조회 RPC ?�수
-- p_period: 'weekly', 'all-time'
-- p_type: 'total', 'time-attack', 'survival'
CREATE OR REPLACE FUNCTION public.get_ranking_v2(
    p_category TEXT,
    p_period TEXT,
    p_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    nickname TEXT,
    score BIGINT,
    rank BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 주간 리그 (Weekly)
    IF p_period = 'weekly' THEN
        RETURN QUERY
        SELECT 
            p.id as user_id,
            COALESCE(p.nickname, '?�명 ?�반가') as nickname,
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack::BIGINT
                WHEN p_type = 'survival' THEN p.weekly_score_survival::BIGINT
                ELSE p.weekly_score_total::BIGINT
            END as score,
            RANK() OVER (
                ORDER BY (
                    CASE 
                        WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                        WHEN p_type = 'survival' THEN p.weekly_score_survival
                        ELSE p.weekly_score_total
                    END
                ) DESC
            ) as rank
        FROM public.profiles p
        WHERE (
            CASE 
                WHEN p_type = 'time-attack' THEN p.weekly_score_timeattack
                WHEN p_type = 'survival' THEN p.weekly_score_survival
                ELSE p.weekly_score_total
            END
        ) > 0
        ORDER BY score DESC
        LIMIT p_limit;

    -- 명예???�당 (All-Time)
    ELSE
        -- 종합 (�?마스?�리 ?�수: game_records???�산)
        IF p_type = 'total' THEN
            RETURN QUERY
            WITH user_mastery AS (
                SELECT gr.user_id, SUM(gr.score) as total_mastery
                FROM public.game_records gr
                WHERE gr.category = p_category
                GROUP BY gr.user_id
            )
            SELECT 
                um.user_id,
                COALESCE(p.nickname, '?�명 ?�반가') as nickname,
                um.total_mastery::BIGINT as score,
                RANK() OVER (ORDER BY um.total_mastery DESC) as rank
            FROM user_mastery um
            LEFT JOIN public.profiles p ON um.user_id = p.id
            ORDER BY score DESC
            LIMIT p_limit;
            
        -- ?�?�어??/ ?�바?�벌 (??? 최고 ?�일 ?�수)
        ELSE
            RETURN QUERY
            SELECT 
                p.id as user_id,
                COALESCE(p.nickname, '?�명 ?�반가') as nickname,
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack::BIGINT
                    ELSE p.best_score_survival::BIGINT
                END as score,
                RANK() OVER (
                    ORDER BY (
                        CASE 
                            WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                            ELSE p.best_score_survival
                        END
                    ) DESC
                ) as rank
            FROM public.profiles p
            WHERE (
                CASE 
                    WHEN p_type = 'time-attack' THEN p.best_score_timeattack
                    ELSE p.best_score_survival
                END
            ) > 0
            ORDER BY score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$;

-- 5. 주간 초기???�수
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0;
END;
$$;
