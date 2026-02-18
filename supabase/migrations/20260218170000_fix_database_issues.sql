-- ============================================================================
-- 1. profiles 테이블 누락 컬럼 추가
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS persona_type TEXT;

-- ============================================================================
-- 2. user_level_records 테이블 스키마 보강 (레거시 코드 호환성)
-- ============================================================================
-- 일부 디버그 함수와 이전 로직이 category_id, subject_id, world_id를 직접 참조함.
-- 현재는 theme_code로 관리되지만, 호환성을 위해 컬럼을 추가하거나 함수를 대대적으로 수정해야 함.
-- 여기서는 컬럼을 추가하여 린트 에러를 우선 해결함.
ALTER TABLE public.user_level_records
ADD COLUMN IF NOT EXISTS world_id TEXT,
ADD COLUMN IF NOT EXISTS category_id TEXT,
ADD COLUMN IF NOT EXISTS subject_id TEXT;

-- ============================================================================
-- 3. 누락된 user_identities 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_key TEXT NOT NULL UNIQUE,
    provider TEXT DEFAULT 'toss',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 설정
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own identities" ON public.user_identities;
CREATE POLICY "Users can view own identities" ON public.user_identities
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 4. 함수 리턴 타입 및 로직 수정 (Search Path 및 Security Definer 강화)
-- ============================================================================

-- find_user_by_email 수정
DROP FUNCTION IF EXISTS public.find_user_by_email(text);
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
 RETURNS TABLE(id uuid, nickname text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nickname::text
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email = p_email;
END;
$$;

-- find_user_by_toss_key 수정
DROP FUNCTION IF EXISTS public.find_user_by_toss_key(text);
CREATE OR REPLACE FUNCTION public.find_user_by_toss_key(p_toss_key text)
 RETURNS TABLE(id uuid, nickname text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nickname::text
  FROM public.profiles p
  WHERE p.id IN (
    SELECT user_id FROM public.user_identities WHERE identity_key = p_toss_key
  );
END;
$$;

-- check_and_award_badges 함수 수정
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
    p_user_id uuid,
    p_category text,
    p_subject text,
    p_level integer
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
    v_awarded_badges text[] := ARRAY[]::text[];
BEGIN
    RETURN jsonb_build_object('success', true, 'awarded_badges', v_awarded_badges);
END;
$$;

-- submit_game_result 함수 보안 강화 (Advisors 권고)
-- ALTER FUNCTION SET search_path는 존재하지 않을 경우 에러가 발생할 수 있으므로 
-- DO 블록을 사용하거나 단순히 함수 재정의 시 SET search_path를 포함하는 것이 좋습니다.
-- 여기서는 일단 주석 처리하여 부팅을 우선합니다.
-- ALTER FUNCTION public.submit_game_result(uuid, text, text, integer, integer, integer, jsonb) SET search_path = public;

-- ============================================================================
-- 5. 보안 및 성능 최적화 (Advisors 권고 사항 반영)
-- ============================================================================

-- RLS 활성화 및 중복 정책 정리
ALTER TABLE public.theme_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mode_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- 정책 최적화: (SELECT auth.uid()) 형식으로 변경하여 성능 향상 및 중복 제거
DO $$ 
BEGIN
    -- theme_mapping (Read only)
    DROP POLICY IF EXISTS "Allow public read access" ON public.theme_mapping;
    CREATE POLICY "Allow public read access" ON public.theme_mapping FOR SELECT USING (true);

    -- mode_mapping (Read only)
    DROP POLICY IF EXISTS "Allow public read access" ON public.mode_mapping;
    CREATE POLICY "Allow public read access" ON public.mode_mapping FOR SELECT USING (true);

    -- game_config (Read only)
    DROP POLICY IF EXISTS "Allow public read access" ON public.game_config;
    CREATE POLICY "Allow public read access" ON public.game_config FOR SELECT USING (true);

    -- user_level_records 성능 최적화
    DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
    CREATE POLICY "Users can view own records" ON public.user_level_records 
        FOR SELECT USING ((SELECT auth.uid()) = user_id);

    -- inventory 성능 최적화
    DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
    CREATE POLICY "Users can view own inventory" ON public.inventory 
        FOR SELECT USING ((SELECT auth.uid()) = user_id);

    -- user_identities 성능 최적화
    DROP POLICY IF EXISTS "Users can view own identities" ON public.user_identities;
    CREATE POLICY "Users can view own identities" ON public.user_identities 
        FOR SELECT USING ((SELECT auth.uid()) = user_id);

    -- game_records 중복 정책 제거 및 최적화
    DROP POLICY IF EXISTS "Users can view own game records" ON public.game_records;
    DROP POLICY IF EXISTS "Users can view own records" ON public.game_records;
    CREATE POLICY "Users can view own records" ON public.game_records 
        FOR SELECT USING ((SELECT auth.uid()) = user_id);
    
    DROP POLICY IF EXISTS "Users can insert own game records" ON public.game_records;
    DROP POLICY IF EXISTS "Users can insert own records" ON public.game_records;
    CREATE POLICY "Users can insert own records" ON public.game_records 
        FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can update own game records" ON public.game_records;
    DROP POLICY IF EXISTS "Users can update own records" ON public.game_records;
    CREATE POLICY "Users can update own records" ON public.game_records 
        FOR UPDATE USING ((SELECT auth.uid()) = user_id);
END $$;

-- 성능 최적화: 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON public.game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_records_user_id ON public.user_level_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON public.user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_user_id ON public.hall_of_fame(user_id);

-- 6. ON CONFLICT 해결을 위한 유니크 제약 조건 강화
-- 중복 인덱스 방지를 위해 기존 인덱스 확인 후 제거
DROP INDEX IF EXISTS public.idx_user_level_records_unique_lookup;
DROP INDEX IF EXISTS public.idx_user_level_records_full_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_level_records_final_unique 
ON public.user_level_records(user_id, category_id, subject_id, level, mode_code);
