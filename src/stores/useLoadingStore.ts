/**
 * 전역 로딩 상태 관리 스토어
 * 여러 로딩 작업을 동시에 추적하고 관리합니다.
 */

import { create } from 'zustand';

interface LoadingState {
  /** 활성 로딩 작업 ID 목록 */
  loadingIds: Set<string>;
  /** 로딩 작업 시작 */
  startLoading: (id: string) => void;
  /** 로딩 작업 종료 */
  stopLoading: (id: string) => void;
  /** 모든 로딩 작업 종료 */
  clearAll: () => void;
  /** 로딩 중인지 확인 */
  isLoading: (id?: string) => boolean;
  /** 전체 로딩 중인지 확인 */
  isAnyLoading: () => boolean;
}

/**
 * 전역 로딩 상태 스토어
 */
export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingIds: new Set<string>(),

  startLoading: (id: string) => {
    set((state) => {
      const newIds = new Set(state.loadingIds);
      newIds.add(id);
      return { loadingIds: newIds };
    });
  },

  stopLoading: (id: string) => {
    set((state) => {
      const newIds = new Set(state.loadingIds);
      newIds.delete(id);
      return { loadingIds: newIds };
    });
  },

  clearAll: () => {
    set({ loadingIds: new Set<string>() });
  },

  isLoading: (id?: string) => {
    const state = get();
    if (id) {
      return state.loadingIds.has(id);
    }
    return state.loadingIds.size > 0;
  },

  isAnyLoading: () => {
    return get().loadingIds.size > 0;
  },
}));
