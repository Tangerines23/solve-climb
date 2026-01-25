/**
 * 에러 처리 유틸리티
 * 개발/프로덕션 환경 구분 및 사용자 친화적 에러 메시지 생성
 */

import { logger } from './logger';
import { useErrorLogStore } from '../stores/useErrorLogStore';
import { analytics } from '@/services/analytics';

const isDevelopment = import.meta.env.DEV;

/**
 * 에러 타입 정의
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 사용자 친화적 에러 메시지 매핑
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '네트워크 연결을 확인해주세요.',
  [ErrorType.VALIDATION]: '입력한 정보를 확인해주세요.',
  [ErrorType.AUTHENTICATION]: '로그인이 필요합니다.',
  [ErrorType.AUTHORIZATION]: '권한이 없습니다.',
  [ErrorType.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ErrorType.SERVER]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorType.UNKNOWN]: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

/**
 * 에러 타입 감지
 */
function detectErrorType(error: unknown): ErrorType {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return ErrorType.NETWORK;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('auth') || message.includes('login')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('server') || message.includes('500')) {
      return ErrorType.SERVER;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * 사용자에게 표시할 에러 메시지 생성
 * 프로덕션에서는 일반적인 메시지만, 개발 환경에서는 상세 정보 포함
 */
export function getUserErrorMessage(error: unknown): string {
  const errorType = detectErrorType(error);
  const baseMessage = USER_FRIENDLY_MESSAGES[errorType];

  if (isDevelopment && error instanceof Error) {
    // 개발 환경에서는 상세 에러 메시지 포함
    return `${baseMessage} (${error.message})`;
  }

  return baseMessage;
}

/**
 * 개발자용 에러 로깅
 * 프로덕션에서는 로깅하지 않음
 */
export function logError(context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = detectErrorType(error);

  logger.error(context, `Error: ${errorMessage}`, error);

  // [Added] Analytics 에러 트래킹
  analytics.trackEvent({
    category: 'system',
    action: 'error',
    label: errorType,
    data: { context, message: errorMessage },
  });

  // 에러 로그 스토어에 기록 (개발 환경에서만)
  if (isDevelopment && error instanceof Error) {
    useErrorLogStore.getState().addLog('error', errorMessage, error.stack, context);
  }
}

/**
 * 경고 로깅
 * 프로덕션에서는 로깅하지 않음
 */
export function logWarning(context: string, message: string): void {
  logger.warn(context, message);

  // 경고 로그 스토어에 기록 (개발 환경에서만)
  if (isDevelopment) {
    useErrorLogStore.getState().addLog('warning', message, undefined, context);
  }
}
