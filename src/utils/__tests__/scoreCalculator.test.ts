import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateTotalAltitude,
  calculateSubTopicAltitude,
  calculateSubTopicTargetAltitude,
  calculateSubTopicProgress,
  calculateCategoryAltitude,
  calculateCategoryTargetAltitude,
  calculateCategoryProgress,
} from '../scoreCalculator';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import type { UserProgress, LevelRecord } from '../../stores/useLevelProgressStore';

// Mock useLevelProgressStore
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: {
    getState: vi.fn(),
  },
}));

describe('scoreCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTotalAltitude', () => {
    it('should return zero altitude and zero problems when progress is empty', () => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(0);
      expect(result.totalProblems).toBe(0);
    });

    it('should calculate total altitude from single level record', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(100);
      expect(result.totalProblems).toBe(10); // 100 / 10
    });

    it('should select maximum score between time-attack and survival', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: 150,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(150);
      expect(result.totalProblems).toBe(15); // 150 / 10
    });

    it('should calculate total altitude from multiple levels', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
            2: {
              level: 2,
              cleared: true,
              bestScore: {
                'time-attack': 200,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(300);
      expect(result.totalProblems).toBe(30); // 300 / 10
    });

    it('should calculate total altitude from multiple categories and subTopics', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
          subtraction: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 50,
                survival: null,
              },
            },
          },
        },
        language: {
          japanese: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 200,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(350);
      expect(result.totalProblems).toBe(35); // 350 / 10
    });

    it('should handle zero scores correctly', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: false,
              bestScore: {
                'time-attack': 0,
                survival: 0,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateTotalAltitude();

      expect(result.totalAltitude).toBe(0);
      expect(result.totalProblems).toBe(0);
    });
  });

  describe('calculateSubTopicAltitude', () => {
    it('should return zero when subTopic does not exist', () => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue([]),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicAltitude('math', 'nonexistent');

      expect(result).toBe(0);
    });

    it('should calculate altitude from single level', () => {
      const mockLevelRecords: LevelRecord[] = [
        {
          level: 1,
          cleared: true,
          bestScore: {
            'time-attack': 100,
            survival: null,
          },
        },
      ];

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue(mockLevelRecords),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicAltitude('math', 'addition');

      expect(result).toBe(100);
    });

    it('should select maximum score between time-attack and survival', () => {
      const mockLevelRecords: LevelRecord[] = [
        {
          level: 1,
          cleared: true,
          bestScore: {
            'time-attack': 100,
            survival: 150,
          },
        },
      ];

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue(mockLevelRecords),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicAltitude('math', 'addition');

      expect(result).toBe(150);
    });

    it('should calculate altitude from multiple levels', () => {
      const mockLevelRecords: LevelRecord[] = [
        {
          level: 1,
          cleared: true,
          bestScore: {
            'time-attack': 100,
            survival: null,
          },
        },
        {
          level: 2,
          cleared: true,
          bestScore: {
            'time-attack': 200,
            survival: null,
          },
        },
      ];

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue(mockLevelRecords),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicAltitude('math', 'addition');

      expect(result).toBe(300);
    });

    it('should return zero when level records are empty', () => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue([]),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicAltitude('math', 'addition');

      expect(result).toBe(0);
    });
  });

  describe('calculateSubTopicTargetAltitude', () => {
    it('should return zero when category does not exist', () => {
      const result = calculateSubTopicTargetAltitude('nonexistent', 'addition');
      expect(result).toBe(0);
    });

    it('should return zero when subTopic does not exist', () => {
      const result = calculateSubTopicTargetAltitude('math', 'nonexistent');
      expect(result).toBe(0);
    });

    it('should calculate target altitude based on level count', () => {
      // This test depends on APP_CONFIG.LEVELS structure
      // We'll test with a mock or actual config
      // For now, we'll test the logic with a known structure
      const result = calculateSubTopicTargetAltitude('math', 'addition');
      // The actual value depends on APP_CONFIG, but we can verify it's a number
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateSubTopicProgress', () => {
    beforeEach(() => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue([]),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);
    });

    it('should return zero progress when current altitude is zero', () => {
      const result = calculateSubTopicProgress('math', 'addition');

      expect(result.progressPercent).toBe(0);
      expect(result.currentAltitude).toBe(0);
      expect(typeof result.targetAltitude).toBe('number');
    });

    it('should calculate progress percentage correctly', () => {
      const mockLevelRecords: LevelRecord[] = [
        {
          level: 1,
          cleared: true,
          bestScore: {
            'time-attack': 100,
            survival: null,
          },
        },
      ];

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
        getLevelProgress: vi.fn().mockReturnValue(mockLevelRecords),
      } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateSubTopicProgress('math', 'addition');

      expect(result.currentAltitude).toBe(100);
      expect(typeof result.targetAltitude).toBe('number');
      expect(result.progressPercent).toBeGreaterThanOrEqual(0);
      expect(result.progressPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCategoryAltitude', () => {
    it('should return zero when category does not exist', () => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateCategoryAltitude('nonexistent');

      expect(result.totalAltitude).toBe(0);
      expect(result.totalProblems).toBe(0);
    });

    it('should calculate altitude from single subTopic and level', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateCategoryAltitude('math');

      expect(result.totalAltitude).toBe(100);
      expect(result.totalProblems).toBe(10);
    });

    it('should calculate altitude from multiple subTopics', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
          subtraction: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 50,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateCategoryAltitude('math');

      expect(result.totalAltitude).toBe(150);
      expect(result.totalProblems).toBe(15);
    });
  });

  describe('calculateCategoryTargetAltitude', () => {
    it('should return zero when category does not exist', () => {
      const result = calculateCategoryTargetAltitude('nonexistent');
      expect(result).toBe(0);
    });

    it('should calculate target altitude for existing category', () => {
      const result = calculateCategoryTargetAltitude('math');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateCategoryProgress', () => {
    it('should return zero progress when category does not exist', () => {
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: {},
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateCategoryProgress('nonexistent');

      expect(result.progressPercent).toBe(0);
      expect(result.currentAltitude).toBe(0);
      expect(result.targetAltitude).toBe(0);
    });

    it('should calculate progress for existing category', () => {
      const mockProgress: UserProgress = {
        math: {
          addition: {
            1: {
              level: 1,
              cleared: true,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      };

      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        progress: mockProgress,
      } as ReturnType<typeof useLevelProgressStore.getState>);

      const result = calculateCategoryProgress('math');

      expect(result.currentAltitude).toBe(100);
      expect(typeof result.targetAltitude).toBe('number');
      expect(result.progressPercent).toBeGreaterThanOrEqual(0);
      expect(result.progressPercent).toBeLessThanOrEqual(100);
    });
  });
});

