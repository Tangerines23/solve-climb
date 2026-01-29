import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SURVIVAL_CONFIG } from '../constants/game';

interface GameState {
  score: number;
  combo: number;
  feverLevel: 0 | 1 | 2; // 0: Normal, 1: Momentum, 2: Second Wind
  isExhausted: boolean; // Stamina 0 state

  // UI Triggers
  showSpeedLines: boolean;
  showVignette: boolean;
  lives: number; // Survival Mode Lives (Hearts)

  setScore: (score: number) => void;
  incrementCombo: () => void;
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
      activeItems: [],
      isStaminaConsumed: false,
      lives: SURVIVAL_CONFIG.INITIAL_LIVES,
      usedItems: [],
      startTime: Date.now(),

      setScore: (score) => set({ score }),

      incrementCombo: () =>
        set((state) => {
          const newCombo = state.combo + 1;
          let newFeverLevel = state.feverLevel;
          let speedLines = state.showSpeedLines;

          if (!state.isExhausted) {
            if (newCombo >= 20) {
              newFeverLevel = 2;
              speedLines = true;
            } else if (newCombo >= 5) {
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

      resetCombo: () => set({ combo: 0, feverLevel: 0, showSpeedLines: false }),

      setCombo: (combo) =>
        set((state) => {
          let newFeverLevel = 0;
          let speedLines = false;

          if (!state.isExhausted) {
            if (combo >= 20) {
              newFeverLevel = 2;
              speedLines = true;
            } else if (combo >= 5) {
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
      storage: createJSONStorage(() => localStorage),
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
