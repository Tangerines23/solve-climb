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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // 1. 서버 측 데이터 삭제 요청 (RPC 또는 Edge Function)
      // 프로필 테이블에서 유저를 삭제하려고 시도하면 RLS 또는 트리거를 통해 처리가능할 수 있음.
      // 하지만 auth.users에서 삭제하는 것이 가장 확실하므로,
      // 기존에 구현된 Edge Function(toss-withdraw 등)의 로직을 참고하거나
      // 현재 세션 유저가 자신을 삭제할 수 있는 RPC가 있는지 확인합니다.

      // 만약 Edge Function 'withdraw-account'가 없다면,
      // 클라이언트에서 처리할 수 있는 범위 내에서 최선을 다하고 에러를 로깅합니다.
      const baseUrl = ENV.VITE_SUPABASE_URL?.replace(/\/$/, '');
      const withdrawUrl = `${baseUrl}/functions/v1/withdraw-account`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
          const errData = await response.json().catch(() => ({}));
          console.error(`[탈퇴] 서버 요청 실패 (${response.status})`, errData);
          throw new Error('계정 삭제 중 오류가 발생했습니다. (서버 응답 오류)');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('[탈퇴] 서버 요청 중 오류 발생:', fetchError);
        throw new Error(
          '계정 삭제 요청 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 다시 시도해 주세요.'
        );
      }
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
