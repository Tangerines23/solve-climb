// 토스 게임 센터 유틸리티
import { submitGameCenterLeaderBoardScore, openGameCenterLeaderboard } from '@apps-in-toss/web-framework';
import { useProfileStore } from '../stores/useProfileStore';

/**
 * 게임 종료 시 점수를 리더보드에 제출
 * @param score 점수 (숫자)
 * @returns 제출 성공 여부
 */
export async function submitScore(score: number): Promise<boolean> {
  try {
    // 브라우저 환경에서는 토스 앱이 아니므로 제출하지 않음
    if (typeof window === 'undefined' || !(window as any).ReactNativeWebView) {
      // 브라우저 환경에서는 조용히 실패
      return false;
    }

    const { isProfileComplete } = useProfileStore.getState();
    
    // 프로필이 생성되지 않았으면 제출하지 않음
    if (!isProfileComplete) {
      console.warn('프로필이 생성되지 않아 점수를 제출할 수 없습니다.');
      return false;
    }

    const result = await submitGameCenterLeaderBoardScore({
      score: score.toString(), // 문자열로 변환
    });

    if (!result) {
      console.warn('지원하지 않는 앱 버전이에요.');
      return false;
    }

    if (result.statusCode === 'SUCCESS') {
      console.log('점수 제출 성공!');
      return true;
    } else {
      console.error('점수 제출 실패:', result.statusCode);
      return false;
    }
  } catch (error) {
    // 브라우저 환경에서 발생하는 오류는 조용히 처리
    if (error instanceof Error && error.message.includes('ReactNativeWebView')) {
      return false;
    }
    console.error('점수 제출 중 오류가 발생했어요.', error);
    return false;
  }
}

/**
 * 토스 게임 센터 리더보드 열기
 */
export async function openLeaderboard(): Promise<boolean> {
  try {
    // 브라우저 환경에서는 토스 앱이 아니므로 열지 않음
    if (typeof window === 'undefined' || !(window as any).ReactNativeWebView) {
      // 브라우저 환경에서는 조용히 실패
      return false;
    }

    const { isProfileComplete } = useProfileStore.getState();
    
    // 프로필이 생성되지 않았으면 열지 않음
    if (!isProfileComplete) {
      console.warn('프로필이 생성되지 않아 리더보드를 열 수 없습니다.');
      return false;
    }

    const result = await openGameCenterLeaderboard();

    if (!result) {
      console.warn('지원하지 않는 앱 버전이에요.');
      return false;
    }

    if (result.statusCode === 'SUCCESS') {
      console.log('리더보드 열기 성공!');
      return true;
    } else {
      console.error('리더보드 열기 실패:', result.statusCode);
      return false;
    }
  } catch (error) {
    // 브라우저 환경에서 발생하는 오류는 조용히 처리
    if (error instanceof Error && error.message.includes('ReactNativeWebView')) {
      return false;
    }
    console.error('리더보드 열기 중 오류가 발생했어요.', error);
    return false;
  }
}

