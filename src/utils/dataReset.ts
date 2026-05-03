import { storageService } from '../services';
import { logError } from './errorHandler';

/**
 * 모든 데이터를 초기화합니다.
 * @param clearProfile 프로필 초기화 함수
 * @param resetProgress 진행도 초기화 함수
 */
export const resetAllData = async (
  clearProfile: () => void,
  resetProgress: () => Promise<void>
): Promise<void> => {
  try {
    // 1. localStorage의 모든 앱 관련 데이터 삭제
    storageService.clear();

    // 2. 외부에서 주입된 스토어 초기화 로직 실행
    clearProfile();
    await resetProgress();

    // 설정 스토어는 초기화하지 않음 (사용자 설정은 유지)
  } catch (error) {
    logError('데이터 초기화', error);
    throw error;
  }
};
