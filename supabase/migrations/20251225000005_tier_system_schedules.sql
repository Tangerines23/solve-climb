-- ============================================================================
-- 티어 시스템 스케줄러 마이그레이션
-- 작성일: 2025.12.25
-- ============================================================================

-- pg_cron 확장 활성화 (이미 되어있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. 데이터 무결성 배치 스케줄러 (매일 새벽 3시 KST 실행)
-- total_mastery_score를 user_level_records에서 재계산하여 데이터 불일치 방지
SELECT cron.schedule(
    'tier-data-integrity-check', -- 작업 이름
    '0 3 * * *', -- 매일 새벽 3시 (UTC 기준, KST는 +9시간이므로 UTC 18시 = KST 3시)
    $$SELECT public.recalculate_mastery_scores()$$
);

-- 2. 주간 점수 초기화 스케줄러 (매주 월요일 0시 KST 실행)
-- 기존 reset_weekly_scores 함수가 있으면 사용, 없으면 새로 생성
-- reset_weekly_scores 함수가 없으면 생성 (기존 함수와 호환되도록 void 반환 유지)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 주간 점수 초기화
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

-- 주간 점수 초기화 스케줄 등록 (기존 스케줄이 없을 때만)
-- UTC 15:00 (일요일) = KST 00:00 (월요일)
DO $$
BEGIN
    -- 기존 스케줄이 없으면 새로 등록
    IF NOT EXISTS (
        SELECT 1 FROM cron.job 
        WHERE jobname = 'weekly-score-reset'
    ) THEN
        -- cron.schedule은 SELECT로 호출해야 함
        EXECUTE format('SELECT cron.schedule(%L, %L, %L)',
            'weekly-score-reset',
            '0 15 * * 0', -- 매주 일요일 UTC 15:00 = 한국 시간 월요일 00:00
            'SELECT public.reset_weekly_scores()'
        );
    END IF;
END $$;

-- 스케줄 확인 쿼리 (참고용)
-- SELECT * FROM cron.job WHERE jobname IN ('tier-data-integrity-check', 'weekly-score-reset');

-- 스케줄 삭제 (필요시 사용)
-- SELECT cron.unschedule('tier-data-integrity-check');
-- SELECT cron.unschedule('weekly-score-reset');

