-- ============================================================================
-- 주간 랭킹 자동 초기화 스케줄링 (pg_cron)
-- ============================================================================

-- 1. pg_cron 확장 활성화 (이미 되어있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 매주 월요일 0시(KST 기준 고려 필요 시 시간 조정)에 reset_weekly_scores() 실행 스케줄 등록
-- UTC 15:00 (일요일) = KST 00:00 (월요일)
SELECT cron.schedule(
    'weekly-score-reset', -- 작업 이름
    '0 15 * * 0',          -- 크론 표현식 (매주 일요일 UTC 15:00 = 한국 시간 월요일 00:00)
    'SELECT public.reset_weekly_scores()'
);

-- (참고) 현재 등록된 스케줄 확인: SELECT * FROM cron.job;
-- (참고) 스케줄 삭제: SELECT cron.unschedule('weekly-score-reset');
