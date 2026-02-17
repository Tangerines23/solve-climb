-- ============================================================================
-- 주간 ??�� ?�동 초기???��?줄링 (pg_cron)
-- ============================================================================

-- 1. pg_cron ?�장 ?�성??(?��? ?�어?�을 ???�음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 매주 ?�요??0??KST 기�? 고려 ?�요 ???�간 조정)??reset_weekly_scores() ?�행 ?��?�??�록
-- UTC 15:00 (?�요?? = KST 00:00 (?�요??
SELECT cron.schedule(
    'weekly-score-reset', -- ?�업 ?�름
    '0 15 * * 0',          -- ?�론 ?�현??(매주 ?�요??UTC 15:00 = ?�국 ?�간 ?�요??00:00)
    'SELECT public.reset_weekly_scores()'
);

-- (참고) ?�재 ?�록???��?�??�인: SELECT * FROM cron.job;
-- (참고) ?��?�???��: SELECT cron.unschedule('weekly-score-reset');
