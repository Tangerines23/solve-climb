import { lazy, ComponentType } from 'react';
import { logger } from './logger';

/**
 * React.lazy를 래핑하여 네트워크 에러(ChunkLoadError) 발생 시
 * 회복 탄력성을 제공하는 유틸리티입니다.
 */
export function resilientLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string = 'Unknown'
) {
  return lazy(async () => {
    const STORAGE_KEY = `resilient-lazy-retry-${componentName}`;

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

      if (isNetworkError) {
        const retryCount = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);

        // 최대 2회까지 자동 재시도 (페이지 리로드 없이)
        if (retryCount < 2) {
          sessionStorage.setItem(STORAGE_KEY, (retryCount + 1).toString());
          logger.warn(
            'ResilientLazy',
            `Retrying ${componentName} due to network error (${retryCount + 1}/2)`
          );

          // 약간의 지연 후 재시도
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return importFn();
        }

        logger.error('ResilientLazy', `Failed to load ${componentName} after retries.`, error);

        // 에러를 던져서 ErrorBoundary에서 잡히게 함
        // 이때 에러 객체에 마킹을 해서 ErrorFallback에서 특수 처리할 수 있게 함
        (error as any).isChunkLoadError = true;
        (error as any).componentName = componentName;
      }

      throw error;
    }
  });
}
