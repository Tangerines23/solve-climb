import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateTotalAltitude,
  calculateSubTopicAltitude,
  calculateSubTopicTargetAltitude,
  calculateSubTopicProgress,
  calculateCategoryAltitude,
  calculateCategoryProgress,
} from '../scoreCalculator';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';

// Mock the store entirely
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
    it('should aggregate best scores across all categories and worlds', () => {
      const mockProgress = {
        World1: {
          기초: {
            L1: { bestScore: { 'time-attack': 100 } },
            L2: { bestScore: { survival: 150 } },
          },
        },
        World2: {
          논리: {
            L1: { bestScore: { 'time-attack': 50, survival: 200 } },
          },
        },
      };

      (useLevelProgressStore.getState as any).mockReturnValue({
        progress: mockProgress,
      });

      const result = calculateTotalAltitude();
      expect(result.totalAltitude).toBe(450);
      expect(result.totalProblems).toBe(45);
    });
  });

  describe('calculateSubTopicAltitude', () => {
    it('should calculate altitude for a specific subtopic', () => {
      const mockGetLevelProgress = vi
        .fn()
        .mockReturnValue([{ bestScore: { 'time-attack': 100 } }, { bestScore: { survival: 50 } }]);

      (useLevelProgressStore.getState as any).mockReturnValue({
        getLevelProgress: mockGetLevelProgress,
      });

      const result = calculateSubTopicAltitude('World1', '기초');
      expect(result).toBe(150);
    });
  });

  describe('calculateSubTopicTargetAltitude', () => {
    it('should calculate target altitude based on level config', () => {
      const result = calculateSubTopicTargetAltitude('World1', '기초');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateSubTopicProgress', () => {
    it('should calculate progress percentage', () => {
      (useLevelProgressStore.getState as any).mockReturnValue({
        getLevelProgress: () => [{ bestScore: { 'time-attack': 100 } }],
      });

      const result = calculateSubTopicProgress('World1', '기초');
      expect(result.currentAltitude).toBe(100);
      expect(result.targetAltitude).toBeGreaterThan(0);
    });
  });

  describe('calculateCategoryAltitude', () => {
    it('should calculate altitude by searching through all worlds', () => {
      const mockProgress = {
        World1: { 기초: { L1: { bestScore: { 'time-attack': 100 } } } },
        World2: { 기초: { L1: { bestScore: { survival: 200 } } } },
      };

      (useLevelProgressStore.getState as any).mockReturnValue({
        progress: mockProgress,
      });
      const result = calculateCategoryAltitude('기초');
      expect(result.totalAltitude).toBe(300);
    });
  });

  describe('calculateCategoryProgress', () => {
    it('should calculate category progress', () => {
      (useLevelProgressStore.getState as any).mockReturnValue({
        progress: { World1: { 기초: { L1: { bestScore: { 'time-attack': 10 } } } } },
      });
      const result = calculateCategoryProgress('기초');
      expect(result.currentAltitude).toBe(10);
      expect(result.targetAltitude).toBeGreaterThan(0);
    });
  });
});
