-- ============================================================================
-- theme_mapping 테이블 category 컬럼 추가 및 데이터 보정
-- 작성일: 2026.05.15
-- 목적: CI DB 무결성 검증 실패 해소 및 도메인 Refactoring 대응
-- ============================================================================

-- 1. category 컬럼 추가 (TEXT)
ALTER TABLE public.theme_mapping 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. 기존 데이터 보정 (theme_id 기반으로 category 추론)
UPDATE public.theme_mapping
SET category = 'math'
WHERE theme_id LIKE 'math_%' OR theme_id IN ('math', 'math_arithmetic', 'math_equations')
  AND category IS NULL;

UPDATE public.theme_mapping
SET category = 'english'
WHERE theme_id LIKE 'eng_%' OR theme_id = 'english'
  AND category IS NULL;

UPDATE public.theme_mapping
SET category = 'logic'
WHERE theme_id LIKE 'logic_%'
  AND category IS NULL;

-- 기본값 설정 (남은 것들)
UPDATE public.theme_mapping
SET category = 'math'
WHERE category IS NULL;

-- 3. 제약 조건 추가 (NOT NULL)
ALTER TABLE public.theme_mapping 
ALTER COLUMN category SET NOT NULL;

-- 4. debug_generate_dummy_record 함수에서 theme_mapping 조회 시 category 고려하도록 (필요 시)
-- 이미 theme_id 기반으로 조회하므로 로직 변경은 최소화하지만, 
-- 향후 확장성을 위해 category 컬럼이 존재함을 보장함.
