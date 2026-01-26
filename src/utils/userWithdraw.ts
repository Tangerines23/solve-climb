import { supabase } from './supabaseClient';
import { useProfileStore } from '../stores/useProfileStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { storage } from './storage';
import { logError } from './errorHandler';
import { ENV } from './env';

/**
 * 회원 탈퇴를 처리합니다.
 * - Supabase Edge Function을 호출하여 auth.users에서 삭제
 * - 로컬 데이터 완전 삭제
 * - 로그아웃 처리
 */
export const withdrawAccount = async (): Promise<boolean> => {
  try {
    console.log('[탈퇴] 시작');

    // 1. Edge Function 호출하여 계정 삭제
    const baseUrl = ENV.VITE_SUPABASE_URL?.replace(/\/$/, '');
    const withdrawUrl = `${baseUrl}/functions/v1/withdraw-account`;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      try {
        const response = await fetch(withdrawUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: ENV.VITE_SUPABASE_ANON_KEY!,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `탈퇴 요청 실패 (${response.status})`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('탈퇴 요청 시간 초과 (10초)');
        }
        throw fetchError;
      }

      console.log('[탈퇴] 서버 계정 삭제 완료');
    }

    // 2. 로컬 데이터 삭제
    storage.clearAppData();
    localStorage.removeItem('solve-climb-local-session');

    // 3. Zustand 스토어 초기화 (순차적으로 처리하여 완결성 보장)
    const profileStore = useProfileStore.getState();
    profileStore.clearProfile();

    const levelProgressStore = useLevelProgressStore.getState();
    await levelProgressStore
      .resetProgress()
      .catch((e) => console.error('Reset progress failed', e));

    // 4. Supabase 로그아웃 (세션 무효화)
    await supabase.auth.signOut();

    console.log('[탈퇴] 모든 과정 완료');
    return true;
  } catch (error) {
    logError('회원 탈퇴', error);
    throw error;
  }
};
