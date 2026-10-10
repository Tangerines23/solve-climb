import { supabase } from './supabaseClient';
import { safeSupabaseQuery } from './debugFetch';
import { useProfileStore } from '../stores/useProfileStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { ENV } from './env';
import { storageService, STORAGE_KEYS } from '../services';
import { logError } from './errorHandler';

/**
 * 회원 탈퇴를 처리합니다.
 * - Supabase Edge Function을 호출하여 auth.users에서 삭제
 * - 로컬 데이터 완전 삭제
 * - 로그아웃 처리
 */
export const withdrawAccount = async (): Promise<boolean> => {
  let serverDeleteSuccess = false;
  let serverErrorMessage: string;

  try {
    console.log('[탈퇴] 시작');
    const result = await attemptServerAccountDeletion();
    serverDeleteSuccess = result.success;
    serverErrorMessage = result.errorMessage;
  } catch (outerError) {
    logError('userWithdraw#outer_exception', outerError);
    serverErrorMessage = outerError instanceof Error ? outerError.message : String(outerError);
  } finally {
    // 2. 서버 성공 여부와 관계없이 로컬 데이터 삭제 (매우 중요)
    console.log('[탈퇴] 로컬 데이터 정리 시작...');
    try {
      // 로컬 스토리지 초기화
      storageService.clear();
      storageService.remove(STORAGE_KEYS.LOCAL_SESSION);

      // Zustand 스토어 초기화
      const profileStore = useProfileStore.getState();
      profileStore.clearProfile();

      const levelProgressStore = useLevelProgressStore.getState();
      await levelProgressStore
        .resetProgress()
        .catch((e) => logError('userWithdraw#progress_reset_fail', e));

      // Supabase 로그아웃 (세션 무효화)
      const signOutResult = supabase.auth.signOut();
      if (signOutResult && typeof signOutResult.catch === 'function') {
        await signOutResult.catch((e) => logError('userWithdraw#auth_signout_fail', e));
      }

      console.log('[탈퇴] 로컬 정리 완료');
    } catch (cleanupError) {
      logError('userWithdraw#cleanup_exception', cleanupError);
    }
  }

  if (!serverDeleteSuccess && serverErrorMessage) {
    throw new Error(
      `계정 삭제 요청 중 오류가 발생했습니다. 네트워크 상태를 확인하시거나 다시 시도해 주세요. (상세: ${serverErrorMessage})`
    );
  }

  return true;
};

async function attemptServerAccountDeletion(): Promise<{
  success: boolean;
  errorMessage: string;
}> {
  const authRes = await safeSupabaseQuery(supabase.auth.getUser());
  const user = authRes?.data?.user;

  if (!user) {
    console.warn('[탈퇴] 활성 세션이 없습니다. 로컬 데이터만 삭제합니다.');
    return { success: true, errorMessage: '' };
  }

  const rpcRes = await safeSupabaseQuery(supabase.rpc('withdraw_user_account'));
  if (rpcRes?.data && rpcRes.data.success) {
    console.log('[탈퇴] 서버 계정 삭제 성공 (RPC)');
    return { success: true, errorMessage: '' };
  }

  const baseUrl = ENV.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const withdrawUrl = `${baseUrl}/functions/v1/withdraw-account`;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: true, errorMessage: '' };
  }

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

    if (response.ok) {
      console.log('[탈퇴] 서버 계정 삭제 성공 (Edge Function)');
      return { success: true, errorMessage: '' };
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || `Error ${response.status}`;
    logError(`userWithdraw#request_fail_${response.status}`, errData);
    return { success: false, errorMessage: errMsg };
  } catch (fetchError) {
    const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    logError('userWithdraw#fetch_exception', fetchError);
    return { success: false, errorMessage: errMsg };
  } finally {
    clearTimeout(timeoutId);
  }
}
