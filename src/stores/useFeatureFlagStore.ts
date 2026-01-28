import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * [ Dynamic Feature Flag Store ]
 * 
 * 애플리케이션의 특정 기능 활성화 상태를 관리합니다.
 * 향후 서버(Supabase) 설정과 연동하여 실시간 제어가 가능하도록 설계되었습니다.
 */

interface FeatureFlags {
    ENABLE_MATH_MOUNTAIN: boolean;
    ENABLE_LANGUAGE_MOUNTAIN: boolean;
    ENABLE_LOGIC_MOUNTAIN: boolean;
    ENABLE_GENERAL_MOUNTAIN: boolean;
    ENABLE_BETA_FEEDBACK: boolean; // 베타 피드백 모달 활성화 여부
}

interface FeatureFlagState {
    flags: FeatureFlags;
    setFlag: (key: keyof FeatureFlags, value: boolean) => void;
    resetFlags: () => void;
}

const DEFAULT_FLAGS: FeatureFlags = {
    ENABLE_MATH_MOUNTAIN: true,
    ENABLE_LANGUAGE_MOUNTAIN: false, // 기본값: 비활성
    ENABLE_LOGIC_MOUNTAIN: true,
    ENABLE_GENERAL_MOUNTAIN: true,
    ENABLE_BETA_FEEDBACK: true,
};

export const useFeatureFlagStore = create<FeatureFlagState>()(
    persist(
        (set) => ({
            flags: DEFAULT_FLAGS,
            setFlag: (key, value) =>
                set((state) => ({
                    flags: { ...state.flags, [key]: value }
                })),
            resetFlags: () => set({ flags: DEFAULT_FLAGS }),
        }),
        {
            name: 'solve-climb-feature-flags', // localStorage에 저장되어 베타 테스트 중 강점 발휘
        }
    )
);
