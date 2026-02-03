// 토스 게임 센터 SDK 래퍼 유틸리티
// @apps-in-toss/web-framework 제거 시 주석 처리. 패키지 복구 시 아래 주석 해제.
// import {
//   submitGameCenterLeaderBoardScore,
//   openGameCenterLeaderboard,
//   isMinVersionSupported,
//   getOperationalEnvironment,
// } from '@apps-in-toss/web-framework';
import { logError, getUserErrorMessage } from './errorHandler';

/**
 * 토스 앱 환경인지 확인
 * @returns 토스 앱 내부에서 실행 중인지 여부
 */
function isTossAppEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // ReactNativeWebView가 있으면 토스 앱 내부
  return !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
}

/**
 * 로컬 개발 환경인지 확인
 * @returns 로컬 개발 환경 여부
 */
function isLocalDevelopment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // localhost 또는 127.0.0.1에서 실행 중이면 로컬 개발 환경
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

/**
 * 게임 종료 시 점수를 리더보드에 제출
 * @param score 점수 (숫자)
 * @returns 제출 성공 여부
 */
export async function submitScoreToLeaderboard(_score: number): Promise<boolean> {
  try {
    // 로컬 개발 환경에서는 시뮬레이션만 수행
    if (isLocalDevelopment() && !isTossAppEnvironment()) {
      return true; // 개발 편의를 위해 성공으로 반환
    }

    // 토스 앱 환경이 아니면 제출하지 않음
    if (!isTossAppEnvironment()) {
      console.warn('[토스 게임 센터] 브라우저 환경에서는 점수를 제출할 수 없습니다.');
      return false;
    }

    // @apps-in-toss/web-framework 제거 시: submitGameCenterLeaderBoardScore 미호출. 패키지 복구 시 아래 주석 해제.
    // const result = await submitGameCenterLeaderBoardScore({ score: _score.toFixed(1) });
    // if (!result) { console.warn('...'); return false; }
    // if (result.statusCode === 'SUCCESS') return true;
    // console.error(`... ${result.statusCode}`); return false;

    return false;
  } catch (error) {
    logError('토스 게임 센터 - 점수 제출', error);
    return false;
  }
}

/**
 * 리더보드 열기 결과 타입
 */
export interface LeaderboardResult {
  success: boolean;
  message?: string;
}

/**
 * 디버깅 정보 수집 (개발 환경)
 */
function collectDebugInfo() {
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  const win = typeof window !== 'undefined' ? window : null;

  try {
    // @apps-in-toss/web-framework 제거 시: getOperationalEnvironment 미호출
    // const operationalEnvironment = getOperationalEnvironment();
    return {
      timestamp: new Date().toISOString(),
      isTossApp: isTossAppEnvironment(),
      isLocalDev: isLocalDevelopment(),
      operationalEnvironment: 'unknown',
      userAgent: win?.navigator?.userAgent || 'unknown',
      location: win?.location?.href || 'unknown',
      hasReactNativeWebView: !!(win as unknown as Record<string, unknown>)?.ReactNativeWebView,
    };
  } catch {
    return {
      timestamp: new Date().toISOString(),
      isTossApp: isTossAppEnvironment(),
      isLocalDev: isLocalDevelopment(),
      operationalEnvironment: 'error',
      userAgent: win?.navigator?.userAgent || 'unknown',
      location: win?.location?.href || 'unknown',
      hasReactNativeWebView: !!(win as unknown as Record<string, unknown>)?.ReactNativeWebView,
    };
  }
}

/**
 * 에러 타입 감지 및 사용자 친화적 메시지 생성
 */
function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return '리더보드를 열 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // 네트워크 관련 오류
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return '네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.';
  }

  // 샌드박스 환경 관련 오류
  if (
    errorMessage.includes('sandbox') ||
    errorMessage.includes('샌드박스') ||
    errorMessage.includes('랭킹 기능은 샌드박스')
  ) {
    return '랭킹 기능은 샌드박스 환경에서는 사용할 수 없어요.';
  }

  // 리더보드 관련 오류
  if (
    errorMessage.includes('leaderboard not found') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('리더보드를 찾을 수 없')
  ) {
    return '리더보드를 찾을 수 없습니다. 미니앱 정보 승인이 완료되었는지 확인해주세요.';
  }

  // 버전 관련 오류
  if (
    errorMessage.includes('version') ||
    errorMessage.includes('버전') ||
    errorMessage.includes('not supported') ||
    errorMessage.includes('지원하지 않')
  ) {
    return '리더보드를 열 수 없습니다. 토스 앱을 최신 버전으로 업데이트해주세요.';
  }

  // 권한 관련 오류
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('권한') ||
    errorMessage.includes('인증')
  ) {
    return '리더보드를 열 권한이 없습니다. 프로필을 확인해주세요.';
  }

  // 타임아웃 오류
  if (errorMessage.includes('timeout') || errorName.includes('timeout')) {
    return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  }

  // 기본 에러 메시지
  return getUserErrorMessage(error) || '리더보드를 열 수 없습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 토스 게임 센터 리더보드 열기
 * @param onError 에러 발생 시 호출할 콜백 함수 (선택사항)
 * @param onRetry 재시도 중일 때 호출할 콜백 함수 (선택사항)
 * @returns 열기 성공 여부와 에러 메시지
 */
export async function openLeaderboard(
  onError?: (message: string) => void,
  _onRetry?: (_attempt: number, _maxRetries: number) => void
): Promise<LeaderboardResult> {
  const debugInfo = collectDebugInfo();

  try {
    // 디버깅 정보 로깅

    // 로컬 개발 환경에서는 시뮬레이션만 수행
    if (isLocalDevelopment() && !isTossAppEnvironment()) {
      const message = '토스 앱에서만 리더보드를 볼 수 있습니다.';
      if (onError) onError(message);
      return { success: false, message };
    }

    // 토스 앱 환경이 아니면 열지 않음
    if (!isTossAppEnvironment()) {
      console.warn('[토스 게임 센터] 브라우저 환경에서는 리더보드를 열 수 없습니다.');
      const message = '토스 앱에서만 리더보드를 볼 수 있습니다.';
      if (onError) onError(message);
      return { success: false, message };
    }

    // @apps-in-toss/web-framework 제거 시: isMinVersionSupported, getOperationalEnvironment, openGameCenterLeaderboard 미호출. 패키지 복구 시 아래 주석 해제.
    // const isSupported = isMinVersionSupported({ android: '5.221.0', ios: '5.221.0' });
    // if (!isSupported) { ... return { success: false, message }; }
    // const operationalEnvironment = getOperationalEnvironment();
    // if (operationalEnvironment === 'sandbox') { ... }
    // if (operationalEnvironment !== 'toss') { ... }
    // openGameCenterLeaderboard(); return { success: true };

    const message = '토스 웹 프레임워크가 비활성화되어 있습니다. (패키지 제거 상태)';
    if (onError) onError(message);
    return { success: false, message };
  } catch (error) {
    logError('토스 게임 센터 - 리더보드 열기', error);

    // 디버깅 정보와 함께 에러 로깅
    if (debugInfo) {
      console.error('[토스 게임 센터] 리더보드 열기 실패 - 디버깅 정보:', {
        ...debugInfo,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      });
    }

    // 에러 타입별 메시지 생성
    const message = getErrorMessage(error);

    if (onError) onError(message);
    return { success: false, message };
  }
}
