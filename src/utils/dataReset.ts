// 데이터 초기화 유틸리티
// import { supabase } from './supabaseClient';
import { useProfileStore } from '../stores/useProfileStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { storageService } from '../services';
import { logError } from './errorHandler';

/**
 * 모든 데이터를 초기화합니다.
 * - Supabase의 game_records 삭제
 * - localStorage의 모든 앱 관련 데이터 삭제
 * - 프로필 및 진행도 초기화
 */
export const resetAllData = async (): Promise<void> => {
  try {
    // 1. Supabase에서 게임 기록 삭제 (Deprecated: game_records 테이블 삭제됨)
    // 과거 데이터 삭제 로직 제거됨

    // 2. localStorage의 모든 앱 관련 데이터 삭제
    storageService.clear();

    // 3. Zustand 스토어 초기화
    // 프로필 스토어 초기화
    const profileStore = useProfileStore.getState();
    profileStore.clearProfile();

    // 진행도 스토어 초기화
    const levelProgressStore = useLevelProgressStore.getState();
    await levelProgressStore.resetProgress();

    // 설정 스토어는 초기화하지 않음 (사용자 설정은 유지)
  } catch (error) {
    logError('데이터 초기화', error);
    throw error;
  }
};
