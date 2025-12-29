-- ============================================================================
-- migrate_existing_records 함수 수정 (game_mode → mode)
-- 작성일: 2025.12.25
-- ============================================================================

-- migrate_existing_records 함수 재생성 (컬럼명 수정)
CREATE OR REPLACE FUNCTION public.migrate_existing_records()
RETURNS JSON AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_processed_users INTEGER := 0;
BEGIN
  -- 1. 기존 game_records 테이블에서 최고 기록 추출하여 user_level_records 생성
  -- ⚠️ game_records 테이블의 실제 컬럼명: mode (game_mode 아님)
  INSERT INTO public.user_level_records (
    user_id, theme_code, level, mode_code, best_score
  )
  SELECT 
    gr.user_id,
    tm.code as theme_code,
    gr.level,
    mm.code as mode_code,
    MAX(gr.score) as best_score
  FROM public.game_records gr
  INNER JOIN public.theme_mapping tm 
    ON tm.theme_id = gr.category || '_' || gr.subject
  INNER JOIN public.mode_mapping mm 
    ON mm.mode_id = gr.mode  -- ✅ 수정: game_mode → mode
  WHERE gr.score > 0
  GROUP BY gr.user_id, tm.code, gr.level, mm.code
  ON CONFLICT (user_id, theme_code, level, mode_code) 
  DO UPDATE SET 
    best_score = GREATEST(user_level_records.best_score, EXCLUDED.best_score),
    updated_at = NOW();
  
  -- 2. total_mastery_score 계산 (모든 최고 기록 합산)
  UPDATE public.profiles p
  SET total_mastery_score = (
    SELECT COALESCE(SUM(best_score), 0)
    FROM public.user_level_records
    WHERE user_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.user_level_records WHERE user_id = p.id
  );
  
  -- 3. 티어 업데이트 (전승 충돌 방지)
  UPDATE public.profiles
  SET 
    current_tier_level = CASE
      WHEN total_mastery_score >= 250000 THEN 6  -- 전설 레벨
      ELSE (public.calculate_tier(total_mastery_score)->>'level')::INTEGER
    END,
    cycle_promotion_pending = CASE
      WHEN total_mastery_score >= 250000 THEN true
      ELSE false
    END,
    pending_cycle_score = CASE
      WHEN total_mastery_score >= 250000 THEN total_mastery_score - 250000
      ELSE 0
    END
  WHERE total_mastery_score > 0;
  
  -- 통계
  SELECT COUNT(DISTINCT user_id) INTO v_processed_users 
  FROM public.user_level_records;
  
  SELECT COUNT(*) INTO v_migrated_count FROM public.user_level_records;
  
  RETURN json_build_object(
    'success', true,
    'migrated_records', v_migrated_count,
    'processed_users', v_processed_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

