import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SURVIVAL_CONFIG } from '../constants/game';
import { zustandStorage } from '@/services';
import { Altitude } from '../domain/Altitude';
import { Combo } from '../domain/Combo';

interface GameState {
  score: Altitude;
  combo: Combo;
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
      score: Altitude.reset(),
      combo: Combo.reset(),
      feverLevel: 0,
      isExhausted: false,
      showSpeedLines: false,
      showVignette: false,
      activeItems: [],
      isStaminaConsumed: false,
      lives: SURVIVAL_CONFIG.INITIAL_LIVES,
      usedItems: [],
      startTime: Date.now(),

      setScore: (value) =>
        set((state) => {
          const result = Altitude.create(value);
          if (!result.success) return state;
          return { score: result.data };
        }),

      incrementCombo: () =>
        set((state) => {
          const newCombo = state.combo.increment();
          let newFeverLevel = newCombo.feverLevel;
          let speedLines = newCombo.showSpeedLines;

          if (state.isExhausted) {
            newFeverLevel = 0;
            speedLines = false;
          }

          return {
            combo: newCombo,
            feverLevel: newFeverLevel,
            showSpeedLines: speedLines,
          };
        }),

      resetCombo: () => set({ combo: Combo.reset(), feverLevel: 0, showSpeedLines: false }),

      setCombo: (value) =>
        set((state) => {
          const result = Combo.create(value);
          if (!result.success) return state;

          const newCombo = result.data;
          let newFeverLevel = newCombo.feverLevel;
          let speedLines = newCombo.showSpeedLines;

          if (state.isExhausted) {
            newFeverLevel = 0;
            speedLines = false;
          }

          return {
            combo: newCombo,
            feverLevel: newFeverLevel,
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
          score: Altitude.reset(),
          combo: Combo.reset(),
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
      // Custom merge logic to rehydrate Combo instances
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<GameState>;
        if (!state) return currentState;

        return {
          ...currentState,
          ...state,
          score: (() => {
            if (state.score && typeof (state.score as any).value === 'number') {
              const result = Altitude.create((state.score as any).value);
              return result.success ? result.data : Altitude.reset();
            }
            return Altitude.reset();
          })(),
          combo: (() => {
            if (state.combo && typeof (state.combo as any).value === 'number') {
              const result = Combo.create((state.combo as any).value);
              return result.success ? result.data : Combo.reset();
            }
            return Combo.reset();
          })(),
        };
      },
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
