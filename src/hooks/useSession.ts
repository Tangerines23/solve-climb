/**
 * 세션 관리 Hook
 * 로컬 세션과 Supabase 세션을 통합 관리합니다.
 */

import { useState, useEffect } from 'react';
import { authApi } from '../utils/api';
import { storage, StorageKeys } from '../utils/storage';
import { parseLocalSession } from '../utils/safeJsonParse';
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
 * 가상 세션 생성 (로컬 세션용)
 */
function createVirtualSession(userId: string, isAdmin: boolean = false): Session {
  return {
    user: {
      id: userId,
      email: null,
      user_metadata: {
        isAdmin: isAdmin || false,
      },
    },
    access_token: 'local',
    refresh_token: 'local',
    expires_in: 3600,
    token_type: 'bearer',
  } as unknown as Session;
}

/**
 * 세션 관리 Hook
 * 로컬 세션과 Supabase 세션을 자동으로 확인하고 통합 관리합니다.
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로컬 세션 확인
  const checkLocalSession = (): Session | null => {
    try {
      const localSessionStr = storage.getString(StorageKeys.LOCAL_SESSION);
      const localSession = parseLocalSession(localSessionStr);
      if (localSession) {
        return createVirtualSession(localSession.userId, localSession.isAdmin);
      }
    } catch {
      // 로컬 세션 파싱 실패 시 무시
    }
    return null;
  };

  // 세션 확인 및 설정
  const checkSession = async () => {
    setIsLoading(true);

    // 1. 로컬 세션 확인
    const localSession = checkLocalSession();
    if (localSession) {
      setSession(localSession);
      setIsLoading(false);
      return;
    }

    // 2. Supabase 세션 확인
    try {
      const supabaseSession = await authApi.getSession();
      setSession(supabaseSession);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 세션 확인
    checkSession();

    // 인증 상태 변경 리스너 등록
    const subscription = authApi.onAuthStateChange((_event, newSession) => {
      // Supabase 세션이 없으면 로컬 세션 확인
      if (!newSession) {
        const localSession = checkLocalSession();
        setSession(localSession);
      } else {
        setSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id || null;
  const isAdmin = session?.user?.user_metadata?.isAdmin || false;

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    userId,
    isAdmin,
  };
}
