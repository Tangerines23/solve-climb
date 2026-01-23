import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabaseClient';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export const useBadgeDefinitions = () => {
  return useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('id, name, description, emoji');

      if (error) throw error;
      return data as BadgeDefinition[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour (static data)
  });
};

export const useUserBadges = (userId: string) => {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!userId,
  });
};
