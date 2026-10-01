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

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInAnonymously: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

let authSubscription: { unsubscribe: () => void } | null = null;

export function _resetAuthSubscriptionForTest(): void {
  if (authSubscription) {
    authSubscription.unsubscribe();
    authSubscription = null;
  }
}

/**
 * 저장된 로컬 세션으로부터 게스트 유저 객체 복원
 */
function resolveGuestUser(): User | null {
  const localSession = storageService.get<{ userId?: string; nickname?: string }>(
    STORAGE_KEYS.LOCAL_SESSION
  );
  if (!localSession?.userId) return null;

  const isValidId =
    isValidUUID(localSession.userId) || String(localSession.userId).startsWith('guest-');
  if (!isValidId) return null;

  return {
    id: localSession.userId,
    app_metadata: { provider: 'anonymous' },
    user_metadata: { nickname: localSession.nickname || '익명 등반가' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    is_anonymous: true,
  } as unknown as User;
}

/**
 * 초기 인증 상태 해석 (Zero Else 가드 클로즈 적용)
 */
function resolveInitialAuth(sbSession: Session | null): {
  session: Session | null;
  user: User | null;
} {
  if (sbSession) {
    return { session: sbSession, user: sbSession.user };
  }

  const guestUser = resolveGuestUser();
  if (guestUser) {
    return { session: null, user: guestUser };
  }

  return { session: null, user: null };
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

    // 1. 실제 Supabase 세션 확인 및 초기 상태 설정
    const {
      data: { session: sbSession },
    } = await safeSupabaseQuery(supabase.auth.getSession());

    const initialAuth = resolveInitialAuth(sbSession);
    set({ session: initialAuth.session, user: initialAuth.user });

    // 2. 기존 구독이 존재할 경우 먼저 해제하여 중복 리스너 메모리 누수 방지
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    // 3. Auth 상태 변경 리스너 단일 등록
    const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
      let currentUser: User | null = session?.user ?? null;

      if (!currentUser && event !== 'SIGNED_OUT') {
        currentUser = resolveGuestUser();
      }

      set({ session, user: currentUser, isLoading: false });

      if (currentUser?.id && !String(currentUser.id).startsWith('guest-')) {
        try {
          useProfileStore.getState().syncProfileWithAuthUser(currentUser.id);
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

      // Analytics 유저 컨텍스트 동기화
      analytics.setUser(currentUser?.id ?? null, {
        email: currentUser?.email,
        last_sign_in: currentUser?.last_sign_in_at,
      });
    });

    authSubscription = subData?.subscription ?? null;
    set({ isLoading: false });
  },

  signInAnonymously: async (): Promise<AuthActionResult> => {
    set({ isLoading: true });
    const { data, error } = await safeSupabaseQuery(supabase.auth.signInAnonymously());

    if (error) {
      console.error('[AuthStore] Manual anonymous sign-in failed:', error.message);
      set({ isLoading: false });
      return { success: false, error: error.message };
    }

    set({ session: data.session, user: data.user, isLoading: false });
    return { success: true };
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
