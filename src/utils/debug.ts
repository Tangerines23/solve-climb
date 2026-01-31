/**
 * 개발 환경 디버깅 도구
 * 개발 환경에서만 활성화되며, 상태 덤프, 네트워크 요청 로깅 등을 제공합니다.
 */

import { logger } from './logger';

const isDevelopment = import.meta.env.DEV;

/**
 * 상태 덤프 유틸리티
 * 객체의 상태를 안전하게 로깅합니다.
 */
export function dumpState<T>(name: string, state: T): void {
  if (!isDevelopment) {
    return;
  }

  try {
    logger.group('Debug', `State: ${name}`, () => {
      logger.table('Debug', state);
    });
  } catch (error) {
    logger.error('Debug', `Failed to dump state: ${name}`, error);
  }
}

/**
 * 네트워크 요청 로깅
 */
export function logNetworkRequest(method: string, url: string, options?: RequestInit): void {
  if (!isDevelopment) {
    return;
  }

  logger.debug('Network', `${method} ${url}`, {
    headers: options?.headers,
    body: options?.body,
  });
}

/**
 * 네트워크 응답 로깅
 */
export function logNetworkResponse(
  method: string,
  url: string,
  response: Response,
  duration?: number
): void {
  if (!isDevelopment) {
    return;
  }

  const logData: Record<string, unknown> = {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  };

  if (duration !== undefined) {
    logData.duration = `${duration.toFixed(2)}ms`;
  }

  logger.debug('Network', `${method} ${url} → ${response.status}`, logData);
}

/**
 * 로컬 스토리지 내용 덤프
 */
export function dumpLocalStorage(): void {
  if (!isDevelopment) {
    return;
  }

  const storage = new Map<string, string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storage.set(key, localStorage.getItem(key) || '');
      }
    }
    logger.group('Debug', 'LocalStorage Dump', () => {
      logger.table('Debug', Object.fromEntries(storage));
    });
  } catch (error) {
    logger.error('Debug', 'Failed to dump localStorage', error);
  }
}

/**
 * 세션 스토리지 내용 덤프
 */
export function dumpSessionStorage(): void {
  if (!isDevelopment) {
    return;
  }

  const storage = new Map<string, string>();
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        storage.set(key, sessionStorage.getItem(key) || '');
      }
    }
    logger.group('Debug', 'SessionStorage Dump', () => {
      logger.table('Debug', Object.fromEntries(storage));
    });
  } catch (error) {
    logger.error('Debug', 'Failed to dump sessionStorage', error);
  }
}

/**
 * 전역 디버그 객체 (개발 환경에서만 window에 추가)
 */
if (isDevelopment && typeof window !== 'undefined') {
  (window as unknown as { debug: typeof debugUtils }).debug = {
    dumpState,
    dumpLocalStorage,
    dumpSessionStorage,
    logNetworkRequest,
    logNetworkResponse,
  };
}

/**
 * 디버그 유틸리티 객체
 */
export const debugUtils = {
  dumpState,
  dumpLocalStorage,
  dumpSessionStorage,
  logNetworkRequest,
  logNetworkResponse,
};
