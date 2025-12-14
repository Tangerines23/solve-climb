// 토스 로그인 유틸리티
import { appLogin } from '@apps-in-toss/web-framework';
import { logError } from './errorHandler';

/**
 * 토스 앱 환경인지 확인
 * @returns 토스 앱 내부에서 실행 중인지 여부
 */
function isTossAppEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // ReactNativeWebView가 있으면 토스 앱 내부
  return !!(window as any).ReactNativeWebView;
}

/**
 * 토스 로그인 결과 타입
 */
export interface TossLoginResult {
  success: boolean;
  authorizationCode?: string;
  referrer?: string;
  error?: string;
}

/**
 * 토스 로그인 실행
 * @returns 인가 코드와 referrer
 */
export async function handleTossLogin(): Promise<TossLoginResult> {
  try {
    // 토스 앱 환경 확인
    if (!isTossAppEnvironment()) {
      return {
        success: false,
        error: '토스 앱에서만 로그인할 수 있습니다.',
      };
    }

    // appLogin 함수 호출
    const result = await appLogin();

    if (!result || !result.authorizationCode) {
      return {
        success: false,
        error: '토스 로그인에 실패했습니다.',
      };
    }

    return {
      success: true,
      authorizationCode: result.authorizationCode,
      referrer: result.referrer || 'DEFAULT',
    };
  } catch (error) {
    logError('토스 로그인', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '토스 로그인 중 오류가 발생했습니다.',
    };
  }
}

