import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export function useBadgeNotification(badgeIds: string[], onClose: () => void) {
  const [badgeDefs, setBadgeDefs] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadgeDefinitions = async () => {
      if (badgeIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('badge_definitions')
          .select('id, name, description, emoji')
          .in('id', badgeIds);

        if (error) throw error;
        setBadgeDefs(data || []);
      } catch (error) {
        console.error('Failed to load badge definitions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeDefinitions();
  }, [badgeIds]);

  useEffect(() => {
    if (badgeIds.length > 0 && !loading) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [badgeIds, loading, onClose]);

  return {
    badgeDefs,
    loading,
  };
}
