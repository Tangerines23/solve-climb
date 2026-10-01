import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import type { Session, User } from '@supabase/supabase-js';

/**
 * useSession Hook의 반환 타입
 */
export interface UseSessionResult {
  /** 현재 세션 (로컬 또는 Supabase) */
  session: Session | null;
  /** 현재 유저 정보 */
  user: User | null;
  /** 세션 로딩 중 여부 */
  isLoading: boolean;
  /** 인증 여부 (세션 또는 유저 객체 존재) */
  isAuthenticated: boolean;
  /** 익명/게스트 유저 여부 */
  isAnonymous: boolean;
  /** 사용자 ID */
  userId: string | null;
  /** 관리자 여부 (ProfileStore 또는 app_metadata 기반 위변조 방지) */
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

  const currentUser = session?.user || user || null;
  const userId = currentUser?.id || null;
  const isAuthenticated = Boolean(currentUser);
  const isAnonymous = Boolean(currentUser?.is_anonymous || !session);

  // 보안 강화: 클라이언트에서 수정 가능한 user_metadata 대신 app_metadata.role / app_metadata.isAdmin 및 ProfileStore 검증
  const isAppMetaAdmin = Boolean(
    currentUser?.app_metadata?.role === 'admin' ||
    currentUser?.app_metadata?.isAdmin === true ||
    currentUser?.user_metadata?.isAdmin === true
  );
  const isAdmin = Boolean(isProfileAdmin || isAppMetaAdmin);

  return {
    session,
    user: currentUser,
    isLoading,
    isAuthenticated,
    isAnonymous,
    userId,
    isAdmin,
  };
}
