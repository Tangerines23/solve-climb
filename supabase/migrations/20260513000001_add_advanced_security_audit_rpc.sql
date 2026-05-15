-- ADVANCED SECURITY AUDIT RPC: check_security_vulnerabilities
-- This function identifies common security misconfigurations:
-- 1. Overly permissive RLS policies (e.g., using 'true' or no qualifiers for anon)
-- 2. SECURITY DEFINER functions without SET search_path

CREATE OR REPLACE FUNCTION check_security_vulnerabilities()
RETURNS TABLE (
    vulnerability_type TEXT,
    object_name TEXT,
    severity TEXT,
    description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- 1. Overly Permissive RLS Policies
    RETURN QUERY
    SELECT 
        'PERMISSIVE_POLICY'::TEXT,
        (schemaname || '.' || tablename || ' (' || policyname || ')')::TEXT,
        'CRITICAL'::TEXT,
        'Policy allows broad access without proper filtering (e.g., USING true).'::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
          qual = '(true)' -- Check for USING (true)
          OR with_check = '(true)' -- Check for WITH CHECK (true)
      )
      AND (roles::text[] @> '{anon}'::text[] OR roles::text[] @> '{public}'::text[]);

    -- 2. SECURITY DEFINER Functions without SET search_path
    RETURN QUERY
    SELECT 
        'INSECURE_FUNCTION'::TEXT,
        (n.nspname || '.' || p.proname)::TEXT,
        'HIGH'::TEXT,
        'SECURITY DEFINER function missing SET search_path configuration.'::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
      AND (p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=%']));
END;
$$;

-- Restricted access
REVOKE ALL ON FUNCTION check_security_vulnerabilities() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_security_vulnerabilities() TO service_role;
GRANT EXECUTE ON FUNCTION check_security_vulnerabilities() TO postgres;
