-- ============================================================================
-- 사용자 검색을 위한 PostgreSQL 함수 (RPC)
-- ============================================================================
-- 작성일: 2025-12-18
-- 목적: Supabase Admin API의 listUsers() 대신 DB 직접 쿼리
-- 장점: 
--   - 네트워크 전송량 감소 (10,000명 → 1명)
--   - 인덱스 활용으로 검색 속도 향상
--   - 메모리 사용량 감소
-- ============================================================================

-- ============================================================================
-- 함수 1: 이메일로 사용자 찾기
-- ============================================================================
CREATE OR REPLACE FUNCTION public.find_user_by_email(target_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  user_metadata JSONB,
  app_metadata JSONB,
  aud TEXT,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.encrypted_password,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    u.last_sign_in_at,
    u.user_metadata,
    u.app_metadata,
    u.aud,
    u.role
  FROM auth.users u
  WHERE u.email = target_email
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.find_user_by_email(TEXT) IS 
'이메일로 사용자 1명 검색 - idx_users_email 인덱스 활용';

-- 함수 실행 권한 부여 (service_role)
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO service_role;

-- ============================================================================
-- 함수 2: tossUserKey로 사용자 찾기
-- ============================================================================
CREATE OR REPLACE FUNCTION public.find_user_by_toss_key(target_key TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  user_metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.user_metadata,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE u.user_metadata->>'tossUserKey' = target_key
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.find_user_by_toss_key(TEXT) IS 
'tossUserKey로 사용자 1명 검색 - idx_users_toss_user_key 인덱스 활용';

-- 함수 실행 권한 부여 (service_role)
GRANT EXECUTE ON FUNCTION public.find_user_by_toss_key(TEXT) TO service_role;

-- ============================================================================
-- 함수 3: 이메일 존재 여부만 확인 (더 빠름)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_exists_by_email(target_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  exists_flag BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = target_email
  ) INTO exists_flag;
  
  RETURN exists_flag;
END;
$$;

COMMENT ON FUNCTION public.user_exists_by_email(TEXT) IS 
'이메일 존재 여부만 빠르게 확인 (SELECT 1 최적화)';

-- 함수 실행 권한 부여 (service_role)
GRANT EXECUTE ON FUNCTION public.user_exists_by_email(TEXT) TO service_role;

-- ============================================================================
-- RPC 함수 생성 완료
--
-- 사용 예시 (Edge Function):
--   const { data } = await supabaseAdmin.rpc('find_user_by_email', { 
--     target_email: 'user@example.com' 
--   });
--
--   const { data } = await supabaseAdmin.rpc('find_user_by_toss_key', { 
--     target_key: '592078416' 
--   });
--
--   const { data: exists } = await supabaseAdmin.rpc('user_exists_by_email', { 
--     target_email: 'user@example.com' 
--   });
-- ============================================================================

