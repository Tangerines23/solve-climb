import { create } from 'zustand';

interface DebugState {
  // Level 1: 빠른 조작 모드 (기존 Admin Debug Mode)
  isAdminMode: boolean;
  selectedResource: 'stamina' | 'minerals' | 'items' | null;

  // Level 2: 고급 디버그 패널
  isDebugPanelOpen: boolean;
  activeTab:
  | 'quick'
  | 'auth'
  | 'ui_lab'
  | 'tier'
  | 'badge'
  | 'game'
  | 'item'
  | 'data'
  | 'errors'
  | 'boundary'
  | 'network'
  | 'visual'
  | 'macro'
  | 'progression';

  // 무한 모드
  infiniteStamina: boolean;
  infiniteMinerals: boolean;
  infiniteTime: boolean;

  // 네트워크 시뮬레이션 (Phase 2)
  networkLatency: number; // 0 = off, 1000+ = 지연 ms
  forceNetworkError: boolean; // true = 모든 요청 실패

  // 시각적 디버그 도구 (Phase 3)
  showSafeAreaGuide: boolean;
  showComponentBorders: boolean;

  // 진행 및 이동 (Phase 6)
  bypassLevelLock: boolean;

  // 플로팅 버튼 제어 (Phase 7)
  showReturnFloater: boolean;
  setShowReturnFloater: (value: boolean) => void;

  // Actions
  toggleAdminMode: () => void;
  setSelectedResource: (resource: 'stamina' | 'minerals' | 'items' | null) => void;
  toggleDebugPanel: () => void;
  setActiveTab: (tab: string) => void;
  setInfiniteStamina: (value: boolean) => void;
  setInfiniteMinerals: (value: boolean) => void;
  setInfiniteTime: (value: boolean) => void;
  setNetworkLatency: (ms: number) => void;
  setForceNetworkError: (value: boolean) => void;
  setShowSafeAreaGuide: (value: boolean) => void;
  setShowComponentBorders: (value: boolean) => void;
  setBypassLevelLock: (value: boolean) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  // 초기 상태
  isAdminMode: false,
  selectedResource: null,
  isDebugPanelOpen: false,
  activeTab: 'quick',
  infiniteStamina: false,
  infiniteMinerals: false,
  infiniteTime: false,
  networkLatency: 0,
  forceNetworkError: false,
  showSafeAreaGuide: false,
  showComponentBorders: false,
  bypassLevelLock: false,
  showReturnFloater: false, // 기본값은 숨김

  // Actions
  setShowReturnFloater: (value) => set({ showReturnFloater: value }),
  toggleAdminMode: () =>
    set((state) => {
      const newMode = !state.isAdminMode;
      return {
        isAdminMode: newMode,
        selectedResource: newMode ? state.selectedResource : null,
      };
    }),

  setSelectedResource: (resource) => set({ selectedResource: resource }),

  toggleDebugPanel: () => set((state) => ({ isDebugPanelOpen: !state.isDebugPanelOpen })),

  setActiveTab: (tab) => set({ activeTab: tab as DebugState['activeTab'] }),

  setInfiniteStamina: (value) => set({ infiniteStamina: value }),
  setInfiniteMinerals: (value) => set({ infiniteMinerals: value }),
  setInfiniteTime: (value) => set({ infiniteTime: value }),
  setNetworkLatency: (ms) => set({ networkLatency: Math.max(0, ms) }),
  setForceNetworkError: (value) => set({ forceNetworkError: value }),
  setShowSafeAreaGuide: (value) => set({ showSafeAreaGuide: value }),
  setShowComponentBorders: (value) => set({ showComponentBorders: value }),
  setBypassLevelLock: (value) => set({ bypassLevelLock: value }),
}));
