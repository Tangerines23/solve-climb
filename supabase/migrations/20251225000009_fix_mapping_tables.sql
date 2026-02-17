-- ============================================================================
-- 매핑 테이블 교정: 실제 game_records 데이터에 맞춰 업데이트
-- 작성일: 2025.12.25
-- ============================================================================
-- 문제: 
-- 1. theme_mapping에 실제 사용되는 테마 (math_arithmetic, math_equations)가 없음
-- 2. mode_mapping에 time-attack (하이픈 포함)이 없음

-- 1. theme_mapping에 실제 사용되는 테마 추가
INSERT INTO public.theme_mapping (code, theme_id, name) VALUES
(7, 'math_arithmetic', '수학 사칙연산'),
(8, 'math_equations', '수학 방정식')
ON CONFLICT (code) DO NOTHING;

-- theme_id가 UNIQUE하므로 별도로 처리 (이미 존재하는 경우 스킵)
INSERT INTO public.theme_mapping (code, theme_id, name)
SELECT 7, 'math_arithmetic', '수학 사칙연산'
WHERE NOT EXISTS (SELECT 1 FROM public.theme_mapping WHERE theme_id = 'math_arithmetic');

INSERT INTO public.theme_mapping (code, theme_id, name)
SELECT 8, 'math_equations', '수학 방정식'
WHERE NOT EXISTS (SELECT 1 FROM public.theme_mapping WHERE theme_id = 'math_equations');

-- 2. mode_mapping에 time-attack (하이픈 포함) 추가는 불필요
-- 마이그레이션 함수에서 하이픈을 제거하여 기존 timeattack과 매칭되도록 처리

-- 3. migrate_existing_records 함수 교정
-- 하이픈 문제 해결: time-attack을 timeattack으로 변환하거나 직접 지정
CREATE OR REPLACE FUNCTION public.migrate_existing_records()
RETURNS JSONB AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_processed_users INTEGER := 0;
BEGIN
  -- 1. 기존 game_records 테이블에서 최고 기록 추출하여 user_level_records 생성
  -- 💡 mode 변환: time-attack -> timeattack (하이픈 제거)
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
    ON mm.mode_id = REPLACE(gr.mode, '-', '')  -- 하이픈 제거: time-attack -> timeattack
    OR mm.mode_id = gr.mode  -- 하이픈이 없는 경우에도 일치
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
  
  -- 3. 티어 업데이트 (급승 충돌 방지)
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
  
  -- ?�계
  SELECT COUNT(DISTINCT user_id) INTO v_processed_users 
  FROM public.user_level_records;
  
  SELECT COUNT(*) INTO v_migrated_count FROM public.user_level_records;
  
  RETURN JSONB_build_object(
    'success', true,
    'migrated_records', v_migrated_count,
    'processed_users', v_processed_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

