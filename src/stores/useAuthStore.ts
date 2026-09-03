import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { storageService, STORAGE_KEYS } from '../services';
import { useProfileStore } from './useProfileStore';
import { useLevelProgressStore } from './useLevelProgressStore';
import { useUserStore } from './useUserStore';
import { useBadgeStore } from './useBadgeStore';

import { analytics } from '@/services/analytics';

import { isValidUUID } from '../utils/validation';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * [Auth Store]
 * 사용자 인증 세션(Google OAuth, Toss Login, 게스트 로그인) 및 인증 상태를 관리합니다.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });

    // 1. 실제 Supabase 세션 확인
    const {
      data: { session: sbSession },
    } = await safeSupabaseQuery(supabase.auth.getSession());

    if (sbSession) {
      set({ session: sbSession, user: sbSession.user });
    } else {
      // 2. 기존에 저장된 로컬 세션이 있는지 확인 (이전에 익명 로그인 등으로 저장된 세션)
      const localSession = storageService.get<{ userId?: string; nickname?: string }>(
        STORAGE_KEYS.LOCAL_SESSION
      );
      if (
        localSession?.userId &&
        (isValidUUID(localSession.userId) || String(localSession.userId).startsWith('guest-'))
      ) {
        const guestUser = {
          id: localSession.userId,
          app_metadata: { provider: 'anonymous' },
          user_metadata: { nickname: localSession.nickname || '익명 등반가' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          is_anonymous: true,
        } as unknown as User;
        set({ session: null, user: guestUser });
      } else {
        // 비로그인 상태 (최초 방문 또는 로그아웃 상태)
        set({ session: null, user: null });
      }
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      let user: User | null = session?.user ?? null;

      if (!user && event !== 'SIGNED_OUT') {
        const localSession = storageService.get<{ userId?: string; nickname?: string }>(
          STORAGE_KEYS.LOCAL_SESSION
        );
        if (
          localSession?.userId &&
          (isValidUUID(localSession.userId) || String(localSession.userId).startsWith('guest-'))
        ) {
          user = {
            id: localSession.userId,
            app_metadata: { provider: 'anonymous' },
            user_metadata: { nickname: localSession.nickname || '익명 등반가' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            is_anonymous: true,
          } as unknown as User;
        }
      }

      set({ session, user, isLoading: false });

      if (user?.id && !String(user.id).startsWith('guest-')) {
        try {
          useProfileStore.getState().syncProfileWithAuthUser(user.id);
        } catch {
          // ignore
        }

        try {
          useLevelProgressStore.getState().syncProgress();
        } catch {
          // ignore
        }

        try {
          useUserStore.getState().fetchUserData();
        } catch {
          // ignore
        }
      }

      // Analytics 유저 컨텍스트 동기화 (Static import 사용)
      analytics.setUser(user?.id ?? null, {
        email: user?.email,
        last_sign_in: user?.last_sign_in_at,
      });
    });

    set({ isLoading: false });
  },

  signInAnonymously: async () => {
    set({ isLoading: true });
    const { data, error } = await safeSupabaseQuery(supabase.auth.signInAnonymously());
    if (error) {
      console.error('[AuthStore] Manual anonymous sign-in failed:', error.message);
    } else {
      set({ session: data.session, user: data.user });
    }
    set({ isLoading: false });
  },

  signOut: async () => {
    await safeSupabaseQuery(supabase.auth.signOut());
    storageService.remove(STORAGE_KEYS.LOCAL_SESSION);
    set({ session: null, user: null });

    // Reset other stores to prevent cross-account state leakage
    try {
      useProfileStore.getState().clearProfile();
    } catch {
      // ignore
    }

    try {
      useLevelProgressStore.setState({ progress: {} });
    } catch {
      // ignore
    }

    try {
      useUserStore.setState({ minerals: 0, stamina: 5, inventory: [] });
    } catch {
      // ignore
    }

    try {
      useBadgeStore.setState({ userBadges: [] });
    } catch {
      // ignore
    }
  },
}));
