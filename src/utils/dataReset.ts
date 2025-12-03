// 데이터 초기화 유틸리티
import { supabase } from './supabaseClient';
import { useProfileStore } from '../stores/useProfileStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';

/**
 * 모든 데이터를 초기화합니다.
 * - Supabase의 game_records 삭제
 * - localStorage의 모든 앱 관련 데이터 삭제
 * - 프로필 및 진행도 초기화
 */
export const resetAllData = async (): Promise<void> => {
  try {
    // 1. Supabase에서 게임 기록 삭제
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('game_records')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to delete game_records from Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Failed to access Supabase:', error);
    }

    // 2. localStorage의 모든 앱 관련 데이터 삭제
    const keysToRemove: string[] = [];
    
    // localStorage의 모든 키를 순회하며 앱 관련 키 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('solve-climb-') ||
        key.startsWith('gameCenterApi_')
      )) {
        keysToRemove.push(key);
      }
    }

    // 찾은 키들 삭제
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });

    // 3. Zustand 스토어 초기화
    // 프로필 스토어 초기화
    const profileStore = useProfileStore.getState();
    profileStore.clearProfile();

    // 진행도 스토어 초기화
    const levelProgressStore = useLevelProgressStore.getState();
    await levelProgressStore.resetProgress();

    // 설정 스토어는 초기화하지 않음 (사용자 설정은 유지)
    
  } catch (error) {
    console.error('Failed to reset all data:', error);
    throw error;
  }
};

