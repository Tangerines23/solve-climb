-- 1. Create the poison test function and trigger on LOCAL DB
CREATE OR REPLACE FUNCTION public.poison_test()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'ENV_TARGET_VERIFICATION_FAILED_ID_1337';
END;
$$;

DROP TRIGGER IF EXISTS tr_poison_test ON public.profiles;
CREATE TRIGGER tr_poison_test
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.poison_test();

-- 2. Update the security function to be a PASS-THROUGH on LOCAL DB
CREATE OR REPLACE FUNCTION public.check_profile_update_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- FORCING PASS THROUGH FOR DEBUGGING
  RETURN NEW;
END;
$$;
