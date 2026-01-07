import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateScoreForTier } from '../tierUtils';
import { loadTierDefinitions, loadCycleCap } from '../../constants/tiers';

// Mock tiers constants
vi.mock('../../constants/tiers', () => ({
  loadTierDefinitions: vi.fn(),
  loadCycleCap: vi.fn(),
}));

describe('tierUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateScoreForTier', () => {
    it('should calculate score for first cycle (stars = 0)', async () => {
      const mockTierDefinitions = [
        { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
        { level: 2, name: '중턱', icon: '⛰️', minScore: 5000, colorVar: '--color-tier-mid' },
        { level: 3, name: '고지대', icon: '🏔️', minScore: 20000, colorVar: '--color-tier-high' },
        { level: 4, name: '봉우리', icon: '🦅', minScore: 50000, colorVar: '--color-tier-peak' },
        { level: 5, name: '정상', icon: '🚩', minScore: 100000, colorVar: '--color-tier-summit' },
        { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 0, 0);

      expect(result).toBe(1000);
      expect(loadTierDefinitions).toHaveBeenCalled();
    });

    it('should calculate score for second cycle (stars = 1)', async () => {
      const mockTierDefinitions = [
        { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 1, 0);

      expect(result).toBe(250000 + 1000); // cycleCap * stars + minScore
    });

    it('should calculate score for third cycle (stars = 2)', async () => {
      const mockTierDefinitions = [
        { level: 2, name: '중턱', icon: '⛰️', minScore: 5000, colorVar: '--color-tier-mid' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(2, 2, 0);

      expect(result).toBe(250000 * 2 + 5000); // cycleCap * stars + minScore
    });

    it('should include bonus score in calculation', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 0, 500);

      expect(result).toBe(1000 + 500); // minScore + bonusScore
    });

    it('should include bonus score in cycle calculation', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 1, 500);

      expect(result).toBe(250000 + 1000 + 500); // cycleCap * stars + minScore + bonusScore
    });

    it('should handle all tier levels (0-6)', async () => {
      const mockTierDefinitions = [
        { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
        { level: 2, name: '중턱', icon: '⛰️', minScore: 5000, colorVar: '--color-tier-mid' },
        { level: 3, name: '고지대', icon: '🏔️', minScore: 20000, colorVar: '--color-tier-high' },
        { level: 4, name: '봉우리', icon: '🦅', minScore: 50000, colorVar: '--color-tier-peak' },
        { level: 5, name: '정상', icon: '🚩', minScore: 100000, colorVar: '--color-tier-summit' },
        { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      for (let level = 0; level <= 6; level++) {
        const result = await calculateScoreForTier(level, 0, 0);
        const tier = mockTierDefinitions.find((t) => t.level === level);
        expect(result).toBe(tier?.minScore || 0);
      }
    });

    it('should return 0 when tier level does not exist', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(99, 0, 0);

      expect(result).toBe(0); // targetTier?.minScore || 0
    });

    it('should handle edge case: level 0 with stars', async () => {
      const mockTierDefinitions = [
        { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(0, 1, 0);

      expect(result).toBe(250000 + 0); // cycleCap * stars + minScore
    });

    it('should handle edge case: maximum level with maximum stars', async () => {
      const mockTierDefinitions = [
        { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(6, 10, 0);

      expect(result).toBe(250000 * 10 + 250000); // cycleCap * stars + minScore
    });

    it('should use default cycleCap when not provided', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000); // Default value

      const result = await calculateScoreForTier(1, 1, 0);

      expect(result).toBe(250000 + 1000);
      expect(loadCycleCap).toHaveBeenCalled();
    });

    it('should handle negative stars value', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      // 음수 stars는 0이 아니므로 사이클 계산에 사용됨
      const result = await calculateScoreForTier(1, -1, 0);

      expect(result).toBe(250000 * -1 + 1000); // -250000 + 1000 = -249000
    });

    it('should handle negative bonusScore', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 0, -100);

      expect(result).toBe(900); // 1000 + (-100)
    });

    it('should handle very large bonusScore', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 0, 1000000);

      expect(result).toBe(1001000); // 1000 + 1000000
    });

    it('should handle very large stars value', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      const result = await calculateScoreForTier(1, 100, 0);

      expect(result).toBe(250000 * 100 + 1000); // cycleCap * stars + minScore
    });

    it('should handle decimal stars value', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      // 소수점 stars는 0이 아니므로 사이클 계산에 사용됨
      const result = await calculateScoreForTier(1, 1.5, 0);

      expect(result).toBe(250000 * 1.5 + 1000); // 376000
    });

    it('should handle negative level gracefully', async () => {
      const mockTierDefinitions = [
        { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      // 음수 level은 찾을 수 없으므로 0 반환
      const result = await calculateScoreForTier(-1, 0, 0);

      expect(result).toBe(0); // targetTier?.minScore || 0
    });

    it('should handle very large level value', async () => {
      const mockTierDefinitions = [
        { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      // 매우 큰 level은 찾을 수 없으므로 0 반환
      const result = await calculateScoreForTier(999999, 0, 0);

      expect(result).toBe(0); // targetTier?.minScore || 0
    });

    it('should handle zero cycleCap', async () => {
      const mockTierDefinitions = [
        { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(0);

      const result = await calculateScoreForTier(1, 1, 0);

      expect(result).toBe(0 + 1000); // 0 * stars + minScore
    });

    it('should handle all parameters with edge values', async () => {
      const mockTierDefinitions = [
        { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
      ];

      vi.mocked(loadTierDefinitions).mockResolvedValue(mockTierDefinitions as any);
      vi.mocked(loadCycleCap).mockResolvedValue(250000);

      // 최대 레벨, 최대 stars, 최대 bonusScore
      const result = await calculateScoreForTier(6, 100, 1000000);

      expect(result).toBe(250000 * 100 + 250000 + 1000000);
    });
  });
});

