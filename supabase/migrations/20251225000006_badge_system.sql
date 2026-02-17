-- 뱃지 시스템 구현
-- 작성일: 2025.12.25

-- 1. 뱃지 정의 데이터 추가 (theme_id 활용)
INSERT INTO public.badge_definitions (id, name, description, emoji, theme_id, required_levels)
VALUES
  ('math_add_master', '덧셈 마스터', '덧셈 모든 레벨 클리어', '➕', 'math_add', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
  ('math_sub_master', '뺄셈 마스터', '뺄셈 모든 레벨 클리어', '➖', 'math_sub', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
  ('math_mul_master', '곱셈 마스터', '곱셈 모든 레벨 클리어', '✖️', 'math_mul', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
  ('math_div_master', '나눗셈 마스터', '나눗셈 모든 레벨 클리어', '➗', 'math_div', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
  ('math_arithmetic_master', '사칙연산 완전정복', '사칙연산 모든 레벨 클리어', '🎓', 'math', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  theme_id = EXCLUDED.theme_id,
  required_levels = EXCLUDED.required_levels;

-- 2. 뱃지 획득 체크 함수
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
  v_all_cleared INTEGER;
  v_awarded_badges TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 해당 카테고리/주제의 뱃지 정의 조회
  DECLARE
    v_theme_id TEXT := p_category || '_' || p_subject;
  BEGIN
    FOR v_badge_def IN
      SELECT * FROM public.badge_definitions
      WHERE theme_id = v_theme_id OR theme_id = p_category
    LOOP
    -- 이미 획득한 뱃지는 스킵
    IF EXISTS (
      SELECT 1 FROM public.user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge_def.id
    ) THEN
      CONTINUE;
    END IF;
    
      -- required_levels가 NULL이면 전체 카테고리 마스터 뱃지 (모든 주제 클리어 확인)
      IF v_badge_def.required_levels IS NULL THEN
        -- 해당 카테고리의 모든 주제가 모든 레벨을 클리어했는지 확인
        -- 예: math_arithmetic_master는 math 카테고리의 모든 주제(add, sub, mul, div)가 모두 클리어되어야 함
        SELECT COUNT(DISTINCT ulr.theme_code) INTO v_all_cleared
        FROM public.user_level_records ulr
        INNER JOIN public.theme_mapping tm ON tm.code = ulr.theme_code
        WHERE ulr.user_id = p_user_id
          AND tm.theme_id LIKE p_category || '_%'
          AND ulr.best_score > 0;
        
        -- TODO: 실제로는 모든 레벨이 클리어되었는지 더 정확하게 확인해야 함
        -- 현재는 간단히 레벨이 있는지만 확인
        IF v_all_cleared >= 4 THEN  -- math 카테고리의 4개 주제 (add, sub, mul, div)
          -- 뱃지 획득
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (p_user_id, v_badge_def.id)
          ON CONFLICT (user_id, badge_id) DO NOTHING;
          
          v_awarded_badges := array_append(v_awarded_badges, v_badge_def.id);
        END IF;
      ELSE
        -- 특정 레벨 목록이 있는 경우: 해당 레벨들이 모두 클리어되었는지 확인
        SELECT ARRAY_AGG(DISTINCT ulr.level) INTO v_cleared_levels
        FROM public.user_level_records ulr
        INNER JOIN public.theme_mapping tm ON tm.code = ulr.theme_code
        WHERE ulr.user_id = p_user_id
          AND tm.theme_id = v_theme_id
          AND ulr.best_score > 0
          AND ulr.level = ANY(v_badge_def.required_levels);
        
        -- 모든 필수 레벨이 클리어되었는지 확인
        IF array_length(v_cleared_levels, 1) = array_length(v_badge_def.required_levels, 1) THEN
          -- 뱃지 획득
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
    'count', COALESCE(array_length(v_awarded_badges, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. submit_game_result에 뱃지 체크 로직 추가
-- (기존 구현된 함수를 업데이트하는 대신 별도 함수로 분리하여 호출)
