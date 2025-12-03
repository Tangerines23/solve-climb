// 토스 게임 센터 SDK 래퍼 유틸리티
// 로컬 개발 환경에서는 실제 호출 없이 시뮬레이션만 수행

import { submitGameCenterLeaderBoardScore, openGameCenterLeaderboard } from '@apps-in-toss/web-framework';
import { useProfileStore } from '../stores/useProfileStore';

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
    // 에러가 발생해도 게임 진행에 방해되지 않도록 조용히 처리
    console.error('[토스 게임 센터] 점수 제출 중 오류가 발생했어요.', error);
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

    const { isProfileComplete } = useProfileStore.getState();
    
    // 프로필이 생성되지 않았으면 열지 않음
    if (!isProfileComplete) {
      console.warn('[토스 게임 센터] 프로필이 생성되지 않아 리더보드를 열 수 없습니다.');
      const message = '프로필을 먼저 생성해주세요.';
      if (onError) onError(message);
      return { success: false, message };
    }

    const result = await openGameCenterLeaderboard();

    if (!result) {
      console.warn('[토스 게임 센터] 지원하지 않는 앱 버전이에요.');
      const message = '리더보드를 열 수 없습니다.';
      if (onError) onError(message);
      return { success: false, message };
    }

    if (result.statusCode === 'SUCCESS') {
      console.log('[토스 게임 센터] 리더보드 열기 성공!');
      return { success: true };
    } else {
      console.error(`[토스 게임 센터] 리더보드 열기 실패: ${result.statusCode}`);
      const message = '리더보드를 열 수 없습니다.';
      if (onError) onError(message);
      return { success: false, message };
    }
  } catch (error) {
    // 에러가 발생해도 앱이 멈추지 않도록 조용히 처리
    console.error('[토스 게임 센터] 리더보드 열기 중 오류가 발생했어요.', error);
    const message = '리더보드를 열 수 없습니다.';
    if (onError) onError(message);
    return { success: false, message };
  }
}

