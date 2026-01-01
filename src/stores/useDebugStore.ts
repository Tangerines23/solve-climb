import { create } from 'zustand';

interface DebugState {
  // Level 1: 빠른 조작 모드 (기존 Admin Debug Mode)
  isAdminMode: boolean;
  selectedResource: 'stamina' | 'minerals' | 'items' | null;
  
  // Level 2: 고급 디버그 패널
  isDebugPanelOpen: boolean;
  activeTab: 'quick' | 'tier' | 'badge' | 'game' | 'item' | 'data' | 'errors' | 'boundary';
  
  // 무한 모드
  infiniteStamina: boolean;
  infiniteMinerals: boolean;
  infiniteTime: boolean;
  
  // Actions
  toggleAdminMode: () => void;
  setSelectedResource: (resource: 'stamina' | 'minerals' | 'items' | null) => void;
  toggleDebugPanel: () => void;
  setActiveTab: (tab: string) => void;
  setInfiniteStamina: (value: boolean) => void;
  setInfiniteMinerals: (value: boolean) => void;
  setInfiniteTime: (value: boolean) => void;
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
  
  // Actions
  toggleAdminMode: () => set((state) => {
    const newMode = !state.isAdminMode;
    return {
      isAdminMode: newMode,
      selectedResource: newMode ? state.selectedResource : null
    };
  }),
  
  setSelectedResource: (resource) => set({ selectedResource: resource }),
  
  toggleDebugPanel: () => set((state) => ({ isDebugPanelOpen: !state.isDebugPanelOpen })),
  
  setActiveTab: (tab) => set({ activeTab: tab as DebugState['activeTab'] }),
  
  setInfiniteStamina: (value) => set({ infiniteStamina: value }),
  setInfiniteMinerals: (value) => set({ infiniteMinerals: value }),
  setInfiniteTime: (value) => set({ infiniteTime: value }),
}));

