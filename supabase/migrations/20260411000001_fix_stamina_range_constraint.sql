-- Migration: Fix Stamina Range Constraint
-- Date: 2026-04-11
-- Description: Increases the maximum allowed stamina from 10 to 999 to support debug operations.

-- 1. Drop the existing restricted constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_stamina_range;

-- 2. Add the expanded constraint
ALTER TABLE public.profiles ADD CONSTRAINT check_stamina_range CHECK (stamina >= 0 AND stamina <= 999);

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
