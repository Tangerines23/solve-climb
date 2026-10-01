/**
 * 세션 관리 Hook
 * 로컬 세션과 Supabase 세션을 통합 관리합니다.
 */

import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Session } from '@supabase/supabase-js';

/**
 * useSession Hook의 반환 타입
 */
export interface UseSessionResult {
  /** 현재 세션 (로컬 또는 Supabase) */
  session: Session | null;
  /** 세션 로딩 중 여부 */
  isLoading: boolean;
  /** 인증 여부 */
  isAuthenticated: boolean;
  /** 사용자 ID */
  userId: string | null;
  /** 관리자 여부 */
  isAdmin: boolean;
}

/**
 * 세션 관리 Hook
 * useAuthStore 및 useProfileStore를 단일 진실 공급원(SSOT)으로 하여 인증 및 세션 상태를 반환합니다.
 */
export function useSession(): UseSessionResult {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isProfileAdmin = useProfileStore((state) => state.isAdmin);

  const userId = session?.user?.id || user?.id || null;
  const isAuthenticated = Boolean(session || user);
  const isAdmin = isProfileAdmin || Boolean(user?.user_metadata?.isAdmin);

  return {
    session,
    isLoading,
    isAuthenticated,
    userId,
    isAdmin,
  };
}
