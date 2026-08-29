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

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const getOrCreateGuestUser = (): User => {
  let guestId = storageService.get<string>('guest_temp_id');
  if (!guestId) {
    guestId =
      'guest-' +
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11));
    storageService.set('guest_temp_id', guestId);
  }
  return {
    id: guestId,
    app_metadata: { provider: 'anonymous' },
    user_metadata: { nickname: '익명 등반가' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    is_anonymous: true,
  } as unknown as User;
};

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
      // 2. 세션이 없으면 DB 생성 없이 로컬 게스트 유저 상태 설정 (최초 제출 시 DB 지연 생성됨)
      console.log(
        '[AuthStore] No active session. Local guest user initialized (DB lazy creation enabled).'
      );
      const guestUser = getOrCreateGuestUser();
      storageService.set(STORAGE_KEYS.LOCAL_SESSION, {
        userId: guestUser.id,
        nickname: '익명 등반가',
        isAnonymous: true,
      });
      set({ session: null, user: guestUser });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? (event === 'SIGNED_OUT' ? null : getOrCreateGuestUser());

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
