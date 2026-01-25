import { useDebugStore } from '../stores/useDebugStore';
import { logError } from './errorHandler';

/**
 * 디버그용 지연 함수
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 네트워크 시뮬레이션을 적용하는 래퍼 함수
 */
export async function debugFetch<T>(fn: () => Promise<T>): Promise<T> {
  if (!import.meta.env.DEV) {
    return fn();
  }

  const { networkLatency, forceNetworkError } = useDebugStore.getState();

  if (networkLatency > 0) {
    await delay(networkLatency);
  }

  if (forceNetworkError) {
    throw new Error('[DEBUG] Forced network error');
  }

  return fn();
}

/**
 * Supabase 쿼리에 리질리언스(재시도 및 로깅) 적용
 * @example
 * const { data, error } = await safeSupabaseQuery(
 *   supabase.from('profiles').select('*')
 * );
 */
export async function safeSupabaseQuery<T>(
  query: PromiseLike<T>,
  options: { retries?: number; context?: string } = {}
): Promise<T> {
  const { retries = 2, context = 'SupabaseQuery' } = options;
  let lastError: unknown;

  for (let i = 0; i <= retries; i++) {
    try {
      // debugFetch를 통해 지연/강제에러 시뮬레이션 포함
      return await debugFetch(() => Promise.resolve(query));
    } catch (err: unknown) {
      lastError = err;

      // 일시적인 에러(5xx, 네트워크)인 경우에만 재시도
      const errorStatus = (err as { status?: number })?.status;
      const isTransient = !errorStatus || (errorStatus >= 500 && errorStatus <= 599);
      if (!isTransient || i === retries) break;

      console.warn(`[Resilience] ${context} 실패, 재시도 중... (${i + 1}/${retries})`);
      await delay(Math.pow(2, i) * 500); // Exponential backoff
    }
  }

  // 최종 실패 시 로깅
  logError(context, lastError);
  throw lastError;
}

/** 하위 호환성을 위한 별칭 */
export const debugSupabaseQuery = safeSupabaseQuery;
