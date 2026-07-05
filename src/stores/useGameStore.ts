import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SURVIVAL_CONFIG } from '../constants/game';
import { zustandStorage } from '../services';

interface GameState {
  score: number;
  combo: number;
  feverLevel: 0 | 1 | 2; // 0: Normal, 1: Momentum, 2: Second Wind
  isExhausted: boolean; // Stamina 0 state

  // UI Triggers
  showSpeedLines: boolean;
  showVignette: boolean;
  lives: number; // Survival Mode Lives (Hearts)
  speedLineStyle: 'original' | 'wind' | 'fog' | 'glow' | 'float' | 'liquid' | 'chalk' | 'sweep' | 'zen';
  setSpeedLineStyle: (style: 'original' | 'wind' | 'fog' | 'glow' | 'float' | 'liquid' | 'chalk' | 'sweep' | 'zen') => void;

  setScore: (score: number) => void;
  incrementCombo: (currentLevel?: number) => void;
  resetCombo: () => void;
  setCombo: (combo: number) => void; // 콤보를 직접 설정 (피버 상태 자동 계산)
  setExhausted: (exhausted: boolean) => void;
  activeItems: string[]; // List of item codes active in the current session
  usedItems: string[]; // Items used in the current session
  setActiveItems: (codes: string[]) => void;
  consumeActiveItem: (code: string) => void;

  // Stamina Session Lock
  isStaminaConsumed: boolean;
  setStaminaConsumed: (consumed: boolean) => void;
  consumeLife: () => void;
  startTime: number | null;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      score: 0,
      combo: 0,
      feverLevel: 0,
      isExhausted: false,
      showSpeedLines: false,
      showVignette: false,
      speedLineStyle: 'float',
      activeItems: [],
      isStaminaConsumed: false,
      lives: SURVIVAL_CONFIG.INITIAL_LIVES,
      usedItems: [],
      startTime: Date.now(),

      setScore: (score) => set({ score }),
      setSpeedLineStyle: (speedLineStyle) => set({ speedLineStyle }),

      incrementCombo: (currentLevel) =>
        set((state) => {
          let comboAdd = 1;
          if (currentLevel !== undefined) {
            if (currentLevel >= 21) {
              comboAdd = 3;
            } else if (currentLevel >= 11) {
              comboAdd = 2;
            } else {
              comboAdd = 1;
            }
          }
          const newCombo = state.combo + comboAdd;
          let newFeverLevel = state.feverLevel;
          let speedLines = state.showSpeedLines;

          if (!state.isExhausted) {
            if (newCombo >= 10) {
              newFeverLevel = 2;
              speedLines = true;
            } else if (newCombo >= 3) {
              newFeverLevel = 1;
              speedLines = true;
            }
          } else {
            newFeverLevel = 0;
            speedLines = false;
          }

          return {
            combo: newCombo,
            feverLevel: newFeverLevel as 0 | 1 | 2,
            showSpeedLines: speedLines,
          };
        }),

      resetCombo: () =>
        set((state) => {
          // 안전 로프(safety_rope)가 활성화되어 있는 경우 실드 발동 및 아이템 소모
          if (state.activeItems.includes('safety_rope')) {
            return {
              activeItems: state.activeItems.filter((code) => code !== 'safety_rope'),
              usedItems: [...state.usedItems, 'safety_rope'],
            };
          }

          // 계단식 감쇄 처리
          let newCombo = 0;
          let newFeverLevel: 0 | 1 | 2 = 0;
          let speedLines = false;

          if (state.feverLevel === 2) {
            newCombo = 3;
            newFeverLevel = 1;
            speedLines = true;
          } else {
            newCombo = 0;
            newFeverLevel = 0;
            speedLines = false;
          }

          return {
            combo: newCombo,
            feverLevel: newFeverLevel,
            showSpeedLines: speedLines,
          };
        }),

      setCombo: (combo) =>
        set((state) => {
          let newFeverLevel = 0;
          let speedLines = false;

          if (!state.isExhausted) {
            if (combo >= 10) {
              newFeverLevel = 2;
              speedLines = true;
            } else if (combo >= 3) {
              newFeverLevel = 1;
              speedLines = true;
            }
          }

          return {
            combo,
            feverLevel: newFeverLevel as 0 | 1 | 2,
            showSpeedLines: speedLines,
          };
        }),

      setExhausted: (exhausted) => set({ isExhausted: exhausted, showVignette: exhausted }),

      setStaminaConsumed: (consumed) => set({ isStaminaConsumed: consumed }),

      consumeLife: () =>
        set((state) => ({
          lives: Math.max(0, state.lives - 1),
        })),

      resetGame: () =>
        set({
          score: 0,
          combo: 0,
          feverLevel: 0,
          isExhausted: false,
          showSpeedLines: false,
          showVignette: false,
          activeItems: [],
          usedItems: [],
          isStaminaConsumed: false,
          lives: SURVIVAL_CONFIG.INITIAL_LIVES,
          startTime: Date.now(),
        }),

      setActiveItems: (codes) => set({ activeItems: codes }),

      consumeActiveItem: (code) =>
        set((state) => ({
          activeItems: state.activeItems.filter((itemCode) => itemCode !== code),
          usedItems: [...state.usedItems, code],
        })),
    }),
    {
      name: 'climb-game-session',
      storage: createJSONStorage(() => zustandStorage),
      // Only persist specific fields that are essential for session recovery
      partialize: (state) => ({
        score: state.score,
        combo: state.combo,
        lives: state.lives,
        activeItems: state.activeItems,
        usedItems: state.usedItems,
        isStaminaConsumed: state.isStaminaConsumed,
      }),
    }
  )
);
