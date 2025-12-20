import { create } from 'zustand';

interface GameState {
    score: number;
    combo: number;
    feverLevel: 0 | 1 | 2; // 0: Normal, 1: Momentum, 2: Second Wind
    isExhausted: boolean; // Stamina 0 state

    // UI Triggers
    showSpeedLines: boolean;
    showVignette: boolean;

    setScore: (score: number) => void;
    incrementCombo: () => void;
    resetCombo: () => void;
    setExhausted: (exhausted: boolean) => void;
    activeItems: string[]; // List of item codes active in the current session
    setActiveItems: (codes: string[]) => void;
    consumeActiveItem: (code: string) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    score: 0,
    combo: 0,
    feverLevel: 0,
    isExhausted: false,
    showSpeedLines: false,
    showVignette: false,
    activeItems: [],

    setScore: (score) => set({ score }),

    incrementCombo: () => set((state) => {
        const newCombo = state.combo + 1;
        let newFeverLevel = state.feverLevel;
        let speedLines = state.showSpeedLines;

        if (newCombo >= 20) {
            newFeverLevel = 2;
            speedLines = true;
        } else if (newCombo >= 5) {
            newFeverLevel = 1;
            speedLines = true;
        }

        return {
            combo: newCombo,
            feverLevel: newFeverLevel as 0 | 1 | 2,
            showSpeedLines: speedLines
        };
    }),

    resetCombo: () => set({ combo: 0, feverLevel: 0, showSpeedLines: false }),

    setExhausted: (exhausted) => set({ isExhausted: exhausted, showVignette: exhausted }),

    resetGame: () => set({
        score: 0,
        combo: 0,
        feverLevel: 0,
        isExhausted: false,
        showSpeedLines: false,
        showVignette: false,
        activeItems: [],
    }),

    setActiveItems: (codes) => set({ activeItems: codes }),

    consumeActiveItem: (code) => set((state) => ({
        activeItems: state.activeItems.filter(itemCode => itemCode !== code)
    })),
}));
