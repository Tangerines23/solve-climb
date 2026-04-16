BEGIN;
-- Set auth.uid for the session
SET LOCAL request.jwt.claims = '{"sub": "2ce637f3-8537-4216-bcb1-c75ad5814aba", "role": "authenticated"}';

-- 1. Test debug_set_stamina (already restored)
SELECT public.debug_set_stamina(100);

-- 2. Test debug_set_tier
SELECT public.debug_set_tier('2ce637f3-8537-4216-bcb1-c75ad5814aba', 5);

-- 3. Test debug_set_mastery_score
SELECT public.debug_set_mastery_score('2ce637f3-8537-4216-bcb1-c75ad5814aba', 50000);

-- 4. Test debug_create_persona_player
SELECT public.debug_create_persona_player('테스트 더미', 'newbie');

-- Verify the updates
SELECT id, nickname, stamina, current_tier_level, total_mastery_score 
FROM public.profiles 
WHERE id = '2ce637f3-8537-4216-bcb1-c75ad5814aba'
   OR nickname = '테스트 더미';

COMMIT;

