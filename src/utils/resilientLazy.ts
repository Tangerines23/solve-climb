import { lazy, ComponentType } from 'react';
import { logger } from './logger';

/**
 * React.lazy를 래핑하여 네트워크 에러(ChunkLoadError) 발생 시
 * 회복 탄력성을 제공하는 유틸리티입니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resilientLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName = 'Unknown'
) {
  return lazy(async () => {
    const STORAGE_KEY = `resilient-lazy-retry-${componentName}`;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    while (retryCount <= MAX_RETRIES) {
      try {
        const component = await importFn();
        // 성공하면 리트라이 기록 초기화
        sessionStorage.removeItem(STORAGE_KEY);
        return component;
      } catch (error) {
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('fetch') ||
            error.message.includes('Loading chunk') ||
            error.message.includes('dynamic import'));

        if (isNetworkError && retryCount < MAX_RETRIES) {
          retryCount++;
          sessionStorage.setItem(STORAGE_KEY, retryCount.toString());
          logger.warn(
            'ResilientLazy',
            `Retrying ${componentName} due to network error (${retryCount}/${MAX_RETRIES})`
          );

          // 약간의 지연 후 재시도
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        // 최종 실패 시 처리
        if (isNetworkError) {
          logger.error(
            'ResilientLazy',
            `Failed to load ${componentName} after ${retryCount} retries.`,
            error
          );
          Object.assign(error as Error, {
            isChunkLoadError: true,
            componentName,
          });
        }
        throw error;
      }
    }

    // unreachable but for Typescript happiness
    throw new Error(`Load failed for ${componentName}`);
  });
}
