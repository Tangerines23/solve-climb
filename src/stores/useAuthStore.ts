import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { storageService, STORAGE_KEYS } from '../services';

import { analytics } from '@/services/analytics';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

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
    } else if (import.meta.env.VITE_SUPABASE_URL) {
      // 2. 세션이 없으면 Supabase 실제 익명 세션 생성 (JWT 토큰 보장)
      console.log('[AuthStore] Establishing real Supabase anonymous session...');
      const { data, error } = await safeSupabaseQuery(supabase.auth.signInAnonymously());
      if (error) {
        console.error('[AuthStore] Supabase anonymous sign-in failed:', error.message);
      } else if (data?.session) {
        set({ session: data.session, user: data.user });
      }
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      set({ session, user, isLoading: false });

      if (user?.id) {
        import('./useProfileStore')
          .then(({ useProfileStore }) => {
            useProfileStore.getState().syncProfileWithAuthUser(user.id);
          })
          .catch(() => {});
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
  },
}));
