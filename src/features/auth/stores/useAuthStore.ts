import { create } from 'zustand';
import { supabase } from '@/utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { safeSupabaseQuery } from '@/features/debug';
import { storageService, STORAGE_KEYS } from '@/services';
import { isValidUUID } from '@/utils/validation';

import { analytics } from '@/services/analytics';

export interface AuthState {
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

    // 1. 로컬 ?�션 ?�선 ?�인 (?�명 ?�용?�용, 가??빠름)
    const localSession = storageService.get<{ userId: string }>(STORAGE_KEYS.LOCAL_SESSION) || null;
    if (localSession && isValidUUID(localSession.userId)) {
      const mockSession = {
        user: { id: localSession.userId, is_anonymous: true },
      } as unknown as Session;
      set({ session: mockSession, user: mockSession.user });
    } else if (localSession) {
      // UUID가 ?�닌 ?�거??ID가 ?�는 경우 ??��
      console.warn('[AuthStore] Clearing legacy non-UUID session:', localSession.userId);
      storageService.remove(STORAGE_KEYS.LOCAL_SESSION);
    }

    // 2. Supabase ?�션 ?�인 (?��? 로컬 ?�션???�어??Supabase ?�션???�선?�위가 ?�을 ???�음)
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

      // 만약 ?��? 로컬 ?�명 ?�션???�는 ?�태?�서 Supabase가 null ?�션??준 경우,
      // 명시?�인 로그?�웃(SIGNED_OUT)???�니?�면 로컬 ?�션???��???
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

      // Analytics ?��? 컨텍?�트 ?�기??(Static import ?�용)
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
