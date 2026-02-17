-- ============================================================================
-- ?�어 ?�스???��?줄러 마이그레?�션
-- ?�성?? 2025.12.25
-- ============================================================================

-- pg_cron ?�장 ?�성??(?��? ?�어?�을 ???�음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. ?�이??무결??배치 ?��?줄러 (매일 ?�벽 3??KST ?�행)
-- total_mastery_score�?user_level_records?�서 ?�계?�하???�이??불일�?방�?
SELECT cron.schedule(
    'tier-data-integrity-check', -- ?�업 ?�름
    '0 3 * * *', -- 매일 ?�벽 3??(UTC 기�?, KST??+9?�간?��?�?UTC 18??= KST 3??
    $$SELECT public.recalculate_mastery_scores()$$
);

-- 2. 주간 ?�수 초기???��?줄러 (매주 ?�요??0??KST ?�행)
-- 기존 reset_weekly_scores ?�수가 ?�으�??�용, ?�으�??�로 ?�성
-- reset_weekly_scores ?�수가 ?�으�??�성 (기존 ?�수?� ?�환?�도�?void 반환 ?��?)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 주간 ?�수 초기??
    UPDATE public.profiles
    SET
        weekly_score_total = 0,
        weekly_score_timeattack = 0,
        weekly_score_survival = 0
    WHERE weekly_score_total > 0 
       OR weekly_score_timeattack > 0 
       OR weekly_score_survival > 0;
END;
$$;

-- 주간 ?�수 초기???��?�??�록 (기존 ?��?줄이 ?�을 ?�만)
-- UTC 15:00 (?�요?? = KST 00:00 (?�요??
DO $$
BEGIN
    -- 기존 ?��?줄이 ?�으�??�로 ?�록
    IF NOT EXISTS (
        SELECT 1 FROM cron.job 
        WHERE jobname = 'weekly-score-reset'
    ) THEN
        -- cron.schedule?� SELECT�??�출?�야 ??
        EXECUTE format('SELECT cron.schedule(%L, %L, %L)',
            'weekly-score-reset',
            '0 15 * * 0', -- 매주 ?�요??UTC 15:00 = ?�국 ?�간 ?�요??00:00
            'SELECT public.reset_weekly_scores()'
        );
    END IF;
END $$;

-- ?��?�??�인 쿼리 (참고??
-- SELECT * FROM cron.job WHERE jobname IN ('tier-data-integrity-check', 'weekly-score-reset');

-- ?��?�???�� (?�요???�용)
-- SELECT cron.unschedule('tier-data-integrity-check');
-- SELECT cron.unschedule('weekly-score-reset');

