// 토스 로그인 유틸리티
// @apps-in-toss/web-framework 제거 시 주석 처리. 패키지 복구 시 아래 주석 해제.
// import { appLogin } from '@apps-in-toss/web-framework';
import { logError } from './errorHandler';

/**
 * 토스 앱 환경인지 확인
 * @returns 토스 앱 내부에서 실행 중인지 여부
 */
export function isTossAppEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // ReactNativeWebView가 있으면 토스 앱 내부
  return !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
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
    if (!isTossAppEnvironment()) {
      return {
        success: false,
        error: '현재 개발 중인 기능입니다. 곧 만나보실 수 있어요!',
      };
    }

    // @apps-in-toss/web-framework 제거 시: appLogin 미호출. 패키지 복구 시 아래 주석 해제.
    // console.log('[토스 로그인] appLogin 호출 시작');
    // let result;
    // try {
    //   result = await appLogin();
    //   console.log('[토스 로그인] appLogin 호출 완료:', {
    //     hasResult: !!result,
    //     hasAuthorizationCode: !!result?.authorizationCode,
    //     authorizationCodePrefix: result?.authorizationCode?.substring(0, 20) || 'N/A',
    //     referrer: result?.referrer || 'N/A',
    //   });
    // } catch (error) {
    //   console.error('[토스 로그인] appLogin 호출 중 예외 발생:', error);
    //   return {
    //     success: false,
    //     error: error instanceof Error ? error.message : '토스 로그인 중 오류가 발생했습니다.',
    //   };
    // }
    // if (!result || !result.authorizationCode) {
    //   console.warn('[토스 로그인] appLogin 결과가 올바르지 않음:', { result, hasAuthorizationCode: !!result?.authorizationCode });
    //   return {
    //     success: false,
    //     error: '토스 로그인에 실패했습니다. authorizationCode를 받을 수 없습니다.',
    //   };
    // }
    // return {
    //   success: true,
    //   authorizationCode: result.authorizationCode,
    //   referrer: result.referrer || 'DEFAULT',
    // };

    return {
      success: false,
      error: '토스 웹 프레임워크가 비활성화되어 있습니다. (패키지 제거 상태)',
    };
  } catch (error) {
    logError('토스 로그인', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '토스 로그인 중 오류가 발생했습니다.',
    };
  }
}
