-- Restrict RLS policies for user data tables to 'authenticated' to resolve Anonymous Access warnings

ALTER POLICY "Users can view own activity" ON public.game_activity TO authenticated;

ALTER POLICY "Users can insert own records" ON public.game_records TO authenticated;
ALTER POLICY "Users can update own records" ON public.game_records TO authenticated;
ALTER POLICY "Users can view own records" ON public.game_records TO authenticated;

ALTER POLICY "Users can insert own sessions" ON public.game_sessions TO authenticated;

ALTER POLICY "Profiles are only updatable via secure RPC" ON public.profiles TO authenticated;

ALTER POLICY "Users can view own badges" ON public.user_badges TO authenticated;

ALTER POLICY "Users can view their own logs" ON public.user_game_logs TO authenticated;

ALTER POLICY "Users can view own identities" ON public.user_identities TO authenticated;

ALTER POLICY "Users can insert own records" ON public.user_level_records TO authenticated;

ALTER POLICY "Users can insert their own statistics" ON public.user_statistics TO authenticated;