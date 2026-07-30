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
  speedLineStyle:
    | 'original'
    | 'wind'
    | 'fog'
    | 'glow'
    | 'float'
    | 'liquid'
    | 'chalk'
    | 'sweep'
    | 'zen';
  setSpeedLineStyle: (
    style: 'original' | 'wind' | 'fog' | 'glow' | 'float' | 'liquid' | 'chalk' | 'sweep' | 'zen'
  ) => void;

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

/**
 * [객체 체조 원칙 적용] 레벨에 따른 콤보 추가 가중치 산출 (Depth 1, else 0개)
 */
function calculateComboAdd(currentLevel?: number): number {
  if (currentLevel === undefined) return 1;
  if (currentLevel >= 21) return 3;
  if (currentLevel >= 11) return 2;
  return 1;
}

/**
 * [객체 체조 원칙 적용] 콤보 및 탈진 상태에 따른 피버 상태 산출 (Depth 1, else 0개)
 */
function calculateFeverState(
  combo: number,
  isExhausted: boolean
): { feverLevel: 0 | 1 | 2; showSpeedLines: boolean } {
  if (isExhausted) return { feverLevel: 0, showSpeedLines: false };
  if (combo >= 10) return { feverLevel: 2, showSpeedLines: true };
  if (combo >= 3) return { feverLevel: 1, showSpeedLines: true };
  return { feverLevel: 0, showSpeedLines: false };
}

/**
 * [객체 체조 원칙 적용] 콤보 리셋 시 피버 레벨 감쇄 상태 산출 (Depth 1, else 0개)
 */
function calculateDecayedComboState(feverLevel: 0 | 1 | 2): {
  combo: number;
  feverLevel: 0 | 1 | 2;
  showSpeedLines: boolean;
} {
  if (feverLevel === 2) return { combo: 3, feverLevel: 1, showSpeedLines: true };
  return { combo: 0, feverLevel: 0, showSpeedLines: false };
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
          const comboAdd = calculateComboAdd(currentLevel);
          const newCombo = state.combo + comboAdd;
          const feverState = calculateFeverState(newCombo, state.isExhausted);

          return {
            combo: newCombo,
            ...feverState,
          };
        }),

      resetCombo: () =>
        set((state) => {
          if (state.activeItems.includes('safety_rope')) {
            return {
              activeItems: state.activeItems.filter((code) => code !== 'safety_rope'),
              usedItems: [...state.usedItems, 'safety_rope'],
            };
          }

          return calculateDecayedComboState(state.feverLevel);
        }),

      setCombo: (combo) =>
        set((state) => {
          const feverState = calculateFeverState(combo, state.isExhausted);
          return {
            combo,
            ...feverState,
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
