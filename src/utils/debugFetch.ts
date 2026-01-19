import { useDebugStore } from '../stores/useDebugStore';

/**
 * 디버그용 지연 함수
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 네트워크 시뮬레이션을 적용하는 래퍼 함수
 * 개발 환경에서만 작동하며, 지연 시간과 강제 에러를 시뮬레이션합니다.
 *
 * @example
 * const data = await debugFetch(() => supabase.from('users').select('*'));
 */
export async function debugFetch<T>(fn: () => Promise<T>): Promise<T> {
  // 프로덕션 환경에서는 바로 실행
  if (!import.meta.env.DEV) {
    return fn();
  }

  const { networkLatency, forceNetworkError } = useDebugStore.getState();

  // 네트워크 지연 시뮬레이션
  if (networkLatency > 0) {
    console.log(`[DEBUG] 네트워크 지연 ${networkLatency}ms 적용 중...`);
    await delay(networkLatency);
  }

  // 강제 에러 시뮬레이션
  if (forceNetworkError) {
    console.error('[DEBUG] 강제 네트워크 에러 발생');
    throw new Error('[DEBUG] Forced network error - 디버그 패널에서 설정됨');
  }

  return fn();
}

/**
 * Supabase 쿼리에 디버그 래퍼 적용
 * @example
 * const { data, error } = await debugSupabaseQuery(
 *   supabase.from('profiles').select('*')
 * );
 */
export async function debugSupabaseQuery<T>(query: PromiseLike<T>): Promise<T> {
  return debugFetch(() => Promise.resolve(query));
}
