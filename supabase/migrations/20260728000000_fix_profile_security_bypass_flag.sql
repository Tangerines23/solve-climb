-- Migration: Fix check_profile_update_security trigger to accept both '1' and 'true'
-- Date: 2026-07-28
-- Description: Resolves P0001 "Direct profile modification restricted for security." by allowing both '1' and 'true' bypass flag values.

CREATE OR REPLACE FUNCTION public.check_profile_update_security()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- bypass 플래그가 '1' 또는 'true'로 설정되어 있으면 통과
    IF (pg_catalog.current_setting('app.bypass_profile_security', true) IN ('1', 'true')) THEN
        RETURN NEW;
    END IF;

    -- 닉네임(nickname) 및 아바타만 변경되는 경우에는 보안 체크 통과
    IF OLD.minerals = NEW.minerals 
       AND OLD.weekly_score_total = NEW.weekly_score_total 
       AND OLD.total_mastery_score = NEW.total_mastery_score THEN
        RETURN NEW;
    END IF;

    -- 점수나 재화 변경 시 시스템 세션 필수
    RAISE EXCEPTION 'Direct profile modification restricted for security.';
END;
$function$;
