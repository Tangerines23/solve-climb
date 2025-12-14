// 토스 게임 센터 SDK 래퍼 유틸리티
// 로컬 개발 환경에서는 실제 호출 없이 시뮬레이션만 수행

import { submitGameCenterLeaderBoardScore, openGameCenterLeaderboard, isMinVersionSupported } from '@apps-in-toss/web-framework';
import { useProfileStore } from '../stores/useProfileStore';
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
  return !!(window as any).ReactNativeWebView;
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
export async function submitScoreToLeaderboard(score: number): Promise<boolean> {
  try {
    // 로컬 개발 환경에서는 시뮬레이션만 수행
    if (isLocalDevelopment() && !isTossAppEnvironment()) {
      console.log(`[로컬 개발] 점수 제출 흉내: ${score}점`);
      return true; // 개발 편의를 위해 성공으로 반환
    }

    // 토스 앱 환경이 아니면 제출하지 않음
    if (!isTossAppEnvironment()) {
      console.warn('[토스 게임 센터] 브라우저 환경에서는 점수를 제출할 수 없습니다.');
      return false;
    }

    const { isProfileComplete } = useProfileStore.getState();
    
    // 프로필이 생성되지 않았으면 제출하지 않음
    if (!isProfileComplete) {
      console.warn('[토스 게임 센터] 프로필이 생성되지 않아 점수를 제출할 수 없습니다.');
      return false;
    }

    const result = await submitGameCenterLeaderBoardScore({
      score: score.toString(), // 문자열로 변환
    });

    if (!result) {
      console.warn('[토스 게임 센터] 지원하지 않는 앱 버전이에요.');
      return false;
    }

    if (result.statusCode === 'SUCCESS') {
      console.log(`[토스 게임 센터] 점수 제출 성공: ${score}점`);
      return true;
    } else {
      console.error(`[토스 게임 센터] 점수 제출 실패: ${result.statusCode}`);
      return false;
    }
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
 * 토스 게임 센터 리더보드 열기
 * @param onError 에러 발생 시 호출할 콜백 함수 (선택사항)
 * @returns 열기 성공 여부와 에러 메시지
 */
export async function openLeaderboard(onError?: (message: string) => void): Promise<LeaderboardResult> {
  try {
    // 로컬 개발 환경에서는 시뮬레이션만 수행
    if (isLocalDevelopment() && !isTossAppEnvironment()) {
      console.log('[로컬 개발] 리더보드 열기 흉내');
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

    // 앱 버전 지원 여부 확인 (토스앱 5.221.0 이상 필요)
    const isSupported = isMinVersionSupported({
      android: "5.221.0",
      ios: "5.221.0",
    });

    if (!isSupported) {
      console.warn('[토스 게임 센터] 지원하지 않는 앱 버전이에요. (최소 버전: 5.221.0)');
      const message = '리더보드를 열 수 없습니다. 토스 앱을 최신 버전으로 업데이트해주세요.';
      if (onError) onError(message);
      return { success: false, message };
    }

    const { isProfileComplete } = useProfileStore.getState();
    
    // 프로필이 생성되지 않았으면 열지 않음
    if (!isProfileComplete) {
      console.warn('[토스 게임 센터] 프로필이 생성되지 않아 리더보드를 열 수 없습니다.');
      const message = '프로필을 먼저 생성해주세요.';
      if (onError) onError(message);
      return { success: false, message };
    }

    // openGameCenterLeaderboard는 Promise<void>를 반환하므로 반환값 체크 불필요
    // 함수 호출 자체가 성공하면 리더보드가 열림
    await openGameCenterLeaderboard();
    
    console.log('[토스 게임 센터] 리더보드 열기 성공!');
    return { success: true };
  } catch (error) {
    logError('토스 게임 센터 - 리더보드 열기', error);
    
    // 특정 에러 메시지 처리
    let message = '리더보드를 열 수 없습니다.';
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('leaderboard not found') || errorMessage.includes('not found')) {
        message = '리더보드를 찾을 수 없습니다. 미니앱 정보 승인이 완료되었는지 확인해주세요.';
      } else if (errorMessage.includes('version') || errorMessage.includes('버전')) {
        message = '리더보드를 열 수 없습니다. 토스 앱을 최신 버전으로 업데이트해주세요.';
      } else {
        message = getUserErrorMessage(error) || message;
      }
    }
    
    if (onError) onError(message);
    return { success: false, message };
  }
}

