-- Initial Seed Data for Local Dev Ranking & Profiles
SELECT pg_catalog.set_config('app.bypass_profile_security', '1', true);

SELECT public.debug_create_persona_player('알파클라이머', 'regular');
SELECT public.debug_create_persona_player('베타스피드', 'speedrunner');
SELECT public.debug_create_persona_player('감마서바이버', 'hardcore');
SELECT public.debug_create_persona_player('델타마스터', 'regular');
SELECT public.debug_create_persona_player('익명등반가E', 'regular');
