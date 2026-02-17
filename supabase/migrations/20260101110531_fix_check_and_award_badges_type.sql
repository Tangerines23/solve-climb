-- Fix: v_all_cleared ?�?�을 BOOLEAN?�서 INTEGER�?변�?
-- ?�슈: COUNT() 결과??INTEGER?�데 BOOLEAN 변?�에 ?�당?�여 ?�???�류 발생

CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_user_id UUID,
  p_category TEXT,
  p_subject TEXT,
  p_level INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_badge_id TEXT;
  v_badge_def RECORD;
  v_cleared_levels INTEGER[];
  v_all_cleared INTEGER;  -- BOOLEAN?�서 INTEGER�??�정
  v_awarded_badges TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- ?�당 카테고리/주제??뱃�? ?�의 조회
  DECLARE
    v_theme_id TEXT := p_category || '_' || p_subject;
  BEGIN
    FOR v_badge_def IN
      SELECT * FROM public.badge_definitions
      WHERE theme_id = v_theme_id OR theme_id = p_category
    LOOP
    -- ?��? ?�득??뱃�????�킵
    IF EXISTS (
      SELECT 1 FROM public.user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge_def.id
    ) THEN
      CONTINUE;
    END IF;
    
      -- required_levels가 NULL?�면 ?�체 카테고리 마스??뱃�? (모든 주제 ?�리???�인)
      IF v_badge_def.required_levels IS NULL THEN
        -- ?�당 카테고리??모든 주제가 모든 ?�벨???�리?�했?��? ?�인
        -- ?? math_arithmetic_master??math 카테고리??모든 주제(add, sub, mul, div)가 모두 ?�리?�되?�야 ??
        SELECT COUNT(DISTINCT ulr.theme_code) INTO v_all_cleared
        FROM public.user_level_records ulr
        INNER JOIN public.theme_mapping tm ON tm.code = ulr.theme_code
        WHERE ulr.user_id = p_user_id
          AND tm.theme_id LIKE p_category || '_%'
          AND ulr.best_score > 0;
        
        -- TODO: ?�제로는 모든 ?�벨???�리?�되?�는지 ???�확?�게 ?�인?�야 ??
        -- ?�재??간단???�벨???�는지�??�인
        IF v_all_cleared >= 4 THEN  -- math 카테고리??4�?주제 (add, sub, mul, div)
          -- 뱃�? ?�득
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge_def.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
          
          v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
        END IF;
      ELSE
        -- ?�정 ?�벨 목록???�는 경우: ?�당 ?�벨?�이 모두 ?�리?�되?�는지 ?�인
        SELECT ARRAY_AGG(DISTINCT ulr.level) INTO v_cleared_levels
        FROM public.user_level_records ulr
        INNER JOIN public.theme_mapping tm ON tm.code = ulr.theme_code
        WHERE ulr.user_id = p_user_id
          AND tm.theme_id = v_theme_id
          AND ulr.best_score > 0
          AND ulr.level = ANY(v_badge_def.required_levels);
        
        -- 모든 ?�수 ?�벨???�리?�되?�는지 ?�인
        IF array_length(v_cleared_levels, 1) = array_length(v_badge_def.required_levels, 1) THEN
          -- 뱃�? ?�득
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge_def.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
          
          v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
        END IF;
      END IF;
    END LOOP;
  END;
  
  RETURN JSONB_build_object(
    'awarded_badges', v_awarded_badges,
    'count', array_length(v_awarded_badges, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

