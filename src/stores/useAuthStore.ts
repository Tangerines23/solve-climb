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

    // 1. 로컬 세션 우선 확인 (익명 사용자용, 가장 빠름)
    const localSession = storageService.get<{ userId: string }>(STORAGE_KEYS.LOCAL_SESSION) || null;
    if (localSession) {
      const mockSession = {
        user: { id: localSession.userId, is_anonymous: true },
      } as unknown as Session;
      set({ session: mockSession, user: mockSession.user });
    }

    // 2. Supabase 세션 확인 (이미 로컬 세션이 있어도 Supabase 세션이 우선순위가 높을 수 있음)
    const {
      data: { session: sbSession },
    } = await safeSupabaseQuery(supabase.auth.getSession());

    if (sbSession) {
      set({ session: sbSession, user: sbSession.user });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      // console.log('[AuthStore] Auth state change:', _event, user?.id);

      // 만약 이미 로컬 익명 세션이 있는 상태에서 Supabase가 null 세션을 준 경우,
      // 명시적인 로그아웃(SIGNED_OUT)이 아니라면 로컬 세션을 유지함
      const eventName = _event as string;
      if (!session && (eventName === 'INITIAL_SESSION' || eventName === 'MFA_CHALLENGE')) {
        const state = useAuthStore.getState();
        if (
          state.session?.user &&
          (state.session.user as unknown as { is_anonymous?: boolean }).is_anonymous
        ) {
          // console.log('[AuthStore] Maintaining local session despite', _event, 'null');
          set({ isLoading: false });
          return;
        }
      }

      set({ session, user, isLoading: false });

      // Analytics 유저 컨텍스트 동기화 (Static import 사용)
      analytics.setUser(user?.id ?? null, {
        email: user?.email,
        last_sign_in: user?.last_sign_in_at,
      });
    });

    // If no session and valid URL exists, try anonymous sign-in (Supabase)
    const currentSession = useAuthStore.getState().session;
    if (!currentSession && import.meta.env.VITE_SUPABASE_URL) {
      console.log('[AuthStore] Attempting Supabase anonymous sign-in...');
      const { data, error } = await safeSupabaseQuery(supabase.auth.signInAnonymously());
      if (error) {
        console.error('[AuthStore] Supabase anonymous sign-in failed:', error.message);
      } else {
        set({ session: data.session, user: data.user });
      }
    }

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
    set({ session: null, user: null });
  },
}));
