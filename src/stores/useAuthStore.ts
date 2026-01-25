import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { debugSupabaseQuery } from '../utils/debugFetch';

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

    // Check current session
    const {
      data: { session },
    } = await debugSupabaseQuery(supabase.auth.getSession());
    set({ session, user: session?.user ?? null });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session, user, isLoading: false });

      // [Added] Analytics 유저 컨텍스트 동기화
      import('@/services/analytics').then(({ analytics }) => {
        analytics.setUser(user?.id ?? null, {
          email: user?.email,
          last_sign_in: user?.last_sign_in_at,
        });
      });
    });

    // If no session and valid URL exists, try anonymous sign-in
    if (!session && supabase.auth.admin /* checking for client readiness or simple ENV check */ && !supabase.auth.getSession.toString().includes('localhost')) {
      // Actually a better way is to check the client instance origin or just the ENV again
    }

    if (!session && import.meta.env.VITE_SUPABASE_URL) {
      const { data, error } = await debugSupabaseQuery(supabase.auth.signInAnonymously());
      if (error) {
        console.error('[AuthStore] Anonymous sign-in failed:', error.message);
      } else {
        set({ session: data.session, user: data.user });
      }
    }

    set({ isLoading: false });
  },

  signInAnonymously: async () => {
    set({ isLoading: true });
    const { data, error } = await debugSupabaseQuery(supabase.auth.signInAnonymously());
    if (error) {
      console.error('[AuthStore] Manual anonymous sign-in failed:', error.message);
    } else {
      set({ session: data.session, user: data.user });
    }
    set({ isLoading: false });
  },

  signOut: async () => {
    await debugSupabaseQuery(supabase.auth.signOut());
    set({ session: null, user: null });
  },
}));
