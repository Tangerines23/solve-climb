import { logError } from './errorHandler';

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

  const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i <= retries; i++) {
    try {
      // 쿼리 실행
      return await Promise.resolve(query);
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
