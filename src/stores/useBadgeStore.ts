import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { storageService, STORAGE_KEYS } from '../services';

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

interface BadgeState {
  badgeDefinitions: BadgeDefinition[];
  userBadges: UserBadge[];
  isLoadingDefinitions: boolean;
  isLoadingUserBadges: boolean;

  // Actions
  fetchBadgeDefinitions: () => Promise<void>;
  fetchUserBadges: (userId: string) => Promise<void>;
  addUserBadge: (badgeId: string, userId: string) => Promise<void>;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  badgeDefinitions: [],
  userBadges: [],
  isLoadingDefinitions: false,
  isLoadingUserBadges: false,

  fetchBadgeDefinitions: async () => {
    // 이미 데이터가 있으면 다시 부르지 않음 (캐싱 효과)
    if (get().badgeDefinitions.length > 0) return;

    set({ isLoadingDefinitions: true });
    try {
      const { data, error } = await safeSupabaseQuery(
        supabase.from('badge_definitions').select('id, name, description, emoji')
      );

      if (error) throw error;
      set({ badgeDefinitions: (data as BadgeDefinition[]) || [] });
    } catch (error) {
      console.error('Failed to fetch badge definitions:', error);
    } finally {
      set({ isLoadingDefinitions: false });
    }
  },

  fetchUserBadges: async (userId: string) => {
    if (!userId) return;

    // UUID 유효성 검사 (익명 유저는 DB 조회 건너뜀)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (!isUuid) {
      // 익명 사용자: 로컬 스토리지에서 뱃지 조회
      try {
        const localBadges = storageService.get<UserBadge[]>(STORAGE_KEYS.LOCAL_BADGES);
        set({ userBadges: localBadges || [], isLoadingUserBadges: false });
      } catch (e) {
        console.warn('Failed to get local badges:', e);
        set({ userBadges: [], isLoadingUserBadges: false });
      }
      return;
    }

    set({ isLoadingUserBadges: true });
    try {
      const { data, error } = await safeSupabaseQuery(
        supabase
          .from('user_badges')
          .select('badge_id, earned_at')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })
      );

      if (error) throw error;
      set({ userBadges: (data as UserBadge[]) || [] });
    } catch (error) {
      console.error('Failed to fetch user badges:', error);
    } finally {
      set({ isLoadingUserBadges: false });
    }
  },

  addUserBadge: async (badgeId: string, userId: string) => {
    // 중복 방지 체크를 최상단으로 이동 (저장소 업데이트 방지)
    if (get().userBadges.some((b) => b.badge_id === badgeId)) return;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const newBadge: UserBadge = {
      badge_id: badgeId,
      earned_at: new Date().toISOString(),
    };

    // 상태 업데이트 (UI 즉시 반영)
    set((state) => ({ userBadges: [newBadge, ...state.userBadges] }));

    if (!isUuid) {
      // 익명 사용자: 로컬 스토리지에 저장
      try {
        const currentBadges = get().userBadges;
        storageService.set(STORAGE_KEYS.LOCAL_BADGES, currentBadges);
      } catch (e) {
        console.warn('Failed to save local badge:', e);
      }
    }
  },
}));
