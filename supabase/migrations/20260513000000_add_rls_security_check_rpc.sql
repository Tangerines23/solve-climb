-- SECURITY CHECK RPC: get_rls_status
-- This function allows authorized scripts (via service_role or specifically granted roles) 
-- to verify that RLS is correctly enabled across all public tables.

CREATE OR REPLACE FUNCTION get_rls_status()
RETURNS TABLE (
    table_name TEXT,
    is_rls_enabled BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to access pg_tables
SET search_path = public, pg_catalog -- Secure search_path
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        relname::TEXT AS table_name,
        relrowsecurity AS is_rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r' -- Only regular tables
    ORDER BY table_name;
END;
$$;

-- REVOKE ALL ON FUNCTION get_rls_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_rls_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_rls_status() TO postgres;
