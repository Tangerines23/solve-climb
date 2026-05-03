import { describe, it, expect } from 'vitest';
import {
  calculateTotalAltitude,
  calculateSubTopicAltitude,
  calculateSubTopicTargetAltitude,
  calculateSubTopicProgress,
  calculateCategoryAltitude,
  calculateCategoryProgress,
} from '../scoreCalculator';

describe('scoreCalculator', () => {
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

  describe('calculateTotalAltitude', () => {
    it('should aggregate best scores across all categories and worlds', () => {
      const result = calculateTotalAltitude(mockProgress);
      expect(result.totalAltitude).toBe(450); // 100 + 150 + 200
      expect(result.totalProblems).toBeGreaterThan(0);
    });
  });

  describe('calculateSubTopicAltitude', () => {
    it('should calculate altitude for a specific subtopic', () => {
      const result = calculateSubTopicAltitude('World1', '기초', mockProgress);
      expect(result).toBe(250); // 100 + 150
    });

    it('should return 0 for non-existent category/subtopic', () => {
      const result = calculateSubTopicAltitude('World3', '기초', mockProgress);
      expect(result).toBe(0);
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
      const progress = {
        World1: {
          기초: {
            L1: { bestScore: { 'time-attack': 1000 } } // Increased score to ensure > 0%
          }
        }
      };
      const result = calculateSubTopicProgress('World1', '기초', progress);
      expect(result.currentAltitude).toBe(1000);
      expect(result.targetAltitude).toBeGreaterThan(0);
      expect(result.progressPercent).toBeGreaterThan(0);
    });
  });

  describe('calculateCategoryAltitude', () => {
    it('should calculate altitude by searching through all worlds', () => {
      const progress = {
        World1: { 기초: { L1: { bestScore: { 'time-attack': 100 } } } },
        World2: { 기초: { L1: { bestScore: { survival: 200 } } } },
      };

      const result = calculateCategoryAltitude('기초', progress);
      expect(result.totalAltitude).toBe(300);
    });

    it('should support world ID as category for backward compatibility', () => {
      const result = calculateCategoryAltitude('World1', mockProgress);
      expect(result.totalAltitude).toBe(250);
    });
  });

  describe('calculateCategoryProgress', () => {
    it('should calculate category progress', () => {
      const progress = {
        World1: { 기초: { L1: { bestScore: { 'time-attack': 1000 } } } }
      };
      const result = calculateCategoryProgress('기초', progress);
      expect(result.currentAltitude).toBe(1000);
      expect(result.targetAltitude).toBeGreaterThan(0);
      expect(result.progressPercent).toBeGreaterThan(0);
    });
  });
});
