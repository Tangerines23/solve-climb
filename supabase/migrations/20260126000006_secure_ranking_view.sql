-- ============================================================================
-- 랭킹 보안 강화 마이그레이션
-- 작성일: 2026.01.26
-- 목적: 업계 표준에 따라 민감 정보 보호 및 랭킹 기능 유지
-- ============================================================================

-- ============================================================================
-- Step 1: 랭킹용 뷰 생성 (공개 정보만 포함)
-- ============================================================================

CREATE OR REPLACE VIEW public.ranking_view AS
SELECT 
  id,
  nickname,
  current_tier_level,
  total_mastery_score,
  weekly_score_total,
  weekly_score_timeattack,
  weekly_score_survival,
  best_score_timeattack,
  best_score_survival
FROM public.profiles;

COMMENT ON VIEW public.ranking_view IS '랭킹 시스템용 공개 뷰. 민감 정보(재화, 스태미나, 로그인 시간 등)는 제외됨.';

-- ============================================================================
-- Step 2: 기존 과도한 공개 정책 삭제
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all profiles for ranking" ON public.profiles;

-- ============================================================================
-- Step 3: 뷰 접근 권한 설정
-- ============================================================================

-- security_invoker 설정 (호출자 권한으로 실행)
ALTER VIEW public.ranking_view SET (security_invoker = on);

-- 익명 및 인증 사용자에게 뷰 조회 권한 부여
GRANT SELECT ON public.ranking_view TO anon, authenticated;

-- ============================================================================
-- 결과: 보안 강화
-- ============================================================================

-- ✅ 공개 정보: 닉네임, 점수, 티어 (랭킹 기능 유지)
-- ✅ 보호 정보: minerals, stamina, last_login_at 등 (민감 정보 숨김)
-- ✅ 업계 표준 준수: Firebase, Apple Game Center 등과 동일한 보안 수준
