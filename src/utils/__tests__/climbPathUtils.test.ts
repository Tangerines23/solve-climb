import { describe, it, expect, vi } from 'vitest';
import {
  determineLevelStatus,
  createSvgSmoothPath,
  determineTargetLevelId,
  calculateClimbPoints,
  calculateSignpostPlacement,
  type ClimbLevelData,
} from '../climbPathUtils';

describe('climbPathUtils', () => {
  describe('calculateSignpostPlacement', () => {
    it('should place on right when left side would overflow (< 10)', () => {
      // leftPlacementX = 50 - 110 - 42 = -102 < 10 => false (right side)
      expect(calculateSignpostPlacement(50, 'basic')).toBe(false);
    });

    it('should place on left when right side would overflow (> 390)', () => {
      // rightPlacementX + 110 = 300 + 42 + 110 = 452 > 390 => true (left side)
      expect(calculateSignpostPlacement(300, 'expert')).toBe(true);
    });

    it('should respect preferred stage placement when within margins', () => {
      // posX = 200: leftPlacementX = 200 - 152 = 48 (>= 10), rightPlacementX + 110 = 242 + 110 = 352 (<= 390)
      expect(calculateSignpostPlacement(200, 'basic')).toBe(true);
      expect(calculateSignpostPlacement(200, 'focus')).toBe(true);
      expect(calculateSignpostPlacement(200, 'other')).toBe(false);
    });
  });

  describe('determineLevelStatus', () => {
    it('should return cleared when isCleared is true', () => {
      expect(determineLevelStatus(true, false)).toBe('cleared');
      expect(determineLevelStatus(true, true)).toBe('cleared');
    });

    it('should return current when isCleared is false and isCurrentOrAdmin is true', () => {
      expect(determineLevelStatus(false, true)).toBe('current');
    });

    it('should return locked when both are false', () => {
      expect(determineLevelStatus(false, false)).toBe('locked');
    });
  });

  describe('createSvgSmoothPath', () => {
    it('should return empty string for empty points array', () => {
      expect(createSvgSmoothPath([])).toBe('');
    });

    it('should return initial move command for single point', () => {
      expect(createSvgSmoothPath([{ x: 10, y: 20 }])).toBe('M 10 20');
    });

    it('should construct smooth quadratic bezier path for multiple points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ];
      const path = createSvgSmoothPath(points);
      expect(path).toBe('M 0 0 Q 50 50, 100 100 Q 150 150, 200 200');
    });
  });

  describe('determineTargetLevelId', () => {
    it('should return current level ID when current level exists', () => {
      const levelData: ClimbLevelData[] = [
        { id: 1, status: 'cleared', position: { x: 0, y: 0 } },
        { id: 2, status: 'current', position: { x: 0, y: 0 } },
        { id: 3, status: 'locked', position: { x: 0, y: 0 } },
      ];
      expect(determineTargetLevelId(levelData)).toBe(2);
    });

    it('should return the last cleared level ID if no current level exists', () => {
      const levelData: ClimbLevelData[] = [
        { id: 1, status: 'cleared', position: { x: 0, y: 0 } },
        { id: 2, status: 'cleared', position: { x: 0, y: 0 } },
        { id: 3, status: 'locked', position: { x: 0, y: 0 } },
      ];
      expect(determineTargetLevelId(levelData)).toBe(2);
    });

    it('should fallback to first level ID or 1 when list is empty or only locked', () => {
      expect(determineTargetLevelId([])).toBe(1);

      const lockedOnly: ClimbLevelData[] = [{ id: 5, status: 'locked', position: { x: 0, y: 0 } }];
      expect(determineTargetLevelId(lockedOnly)).toBe(5);
    });
  });

  describe('calculateClimbPoints', () => {
    it('should calculate level data, path points, and heights accurately', () => {
      const mockIsCleared = vi.fn((_w, _c, id) => id === 1);
      const levels = [
        { level: 1, name: 'L1' },
        { level: 2, name: 'L2' },
        { level: 3, name: 'L3' },
      ];

      const result = calculateClimbPoints({
        totalLevels: 3,
        levels,
        fixedMaxLevels: 10,
        nodeSpacing: 50,
        listDistance: 100,
        svgWidth: 400,
        world: 'World1',
        category: 'math_add',
        nextLevel: 2,
        isAdmin: false,
        isLevelCleared: mockIsCleared,
      });

      expect(result.levelData).toHaveLength(3);
      expect(result.pathPoints).toHaveLength(3);
      expect(result.lastClearedIndex).toBe(0);
      expect(result.levelData[0].status).toBe('cleared');
      expect(result.levelData[1].status).toBe('current');
      expect(result.levelData[2].status).toBe('locked');
      expect(result.svgHeight).toBe(100 + 9 * 50 + 100); // 650
    });
  });
});
