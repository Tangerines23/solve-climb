import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getTodayChallenge,
  generateTodayChallenge,
  SeededRandom,
  type TodayChallenge,
} from '../challenge';
import { storageService, STORAGE_KEYS } from '../../services';
import { APP_CONFIG } from '../../config/app';

// Mock storage
vi.mock('../../services', () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
  },
  STORAGE_KEYS: {
    TODAY_CHALLENGE: 'today_challenge',
    TODAY_CHALLENGE_DATE: 'today_challenge_date',
  },
}));

describe('challenge', () => {
  const mockFlags = {
    ENABLE_MATH_MOUNTAIN: true,
    ENABLE_LANGUAGE_MOUNTAIN: true,
    ENABLE_LOGIC_MOUNTAIN: true,
    ENABLE_GENERAL_MOUNTAIN: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z')); // 20240115
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('SeededRandom', () => {
    it('should generate deterministic numbers', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);
      expect(rng1.random()).toBe(rng2.random());
      expect(rng1.randomInt(1, 100)).toBe(rng2.randomInt(1, 100));
    });

    it('should generate different numbers for different seeds', () => {
      const rng1 = new SeededRandom(111);
      const rng2 = new SeededRandom(222);
      expect(rng1.random()).not.toBe(rng2.random());
    });
  });

  describe('generateTodayChallenge (Fallback Branches)', () => {
    it('should handle empty subTopics with a fallback challenge', () => {
      // Mock sub-topics as empty
      const originalSubTopics = APP_CONFIG.SUB_TOPICS;
      // @ts-expect-error -- Modifying readonly config for test
      APP_CONFIG.SUB_TOPICS = {
        math: [],
        language: [],
        logic: [],
        general: [],
      };

      const challenge = generateTodayChallenge({}, mockFlags);
      expect(challenge.topicId).toBe('default');
      expect(challenge.title).toContain('기본 챌린지');

      // Cleanup
      // @ts-expect-error -- Restoring readonly config
      APP_CONFIG.SUB_TOPICS = originalSubTopics;
    });

    it('should handle missing levels with a fallback challenge', () => {
      // Mock empty levels
      const originalLevels = APP_CONFIG.LEVELS;
      // @ts-expect-error -- Mocking invalid config
      APP_CONFIG.LEVELS = {
        World1: {},
      };

      const challenge = generateTodayChallenge({}, mockFlags);
      expect(challenge.level).toBe(1);
      expect(challenge.title).toContain('입문!');

      // Cleanup
      // @ts-expect-error -- Restoring readonly config
      APP_CONFIG.LEVELS = originalLevels;
    });
  });

  describe('getTodayChallenge', () => {
    it('should return cached challenge when date matches', async () => {
      const todayDate = '2024-01-15';
      const cachedChallenge: TodayChallenge = {
        id: `today_challenge_${todayDate}`,
        title: 'Cached Challenge',
        category: '수학',
        categoryId: 'math',
        topic: '덧셈',
        topicId: 'addition',
        mode: 'time-attack',
        level: 1,
        worldId: 'World1',
      };

      vi.mocked(storageService.get).mockImplementation((key) => {
        if (key === STORAGE_KEYS.TODAY_CHALLENGE_DATE) return todayDate;
        if (key === STORAGE_KEYS.TODAY_CHALLENGE) return cachedChallenge;
        return null;
      });

      const result = await getTodayChallenge({}, mockFlags);

      expect(result).toEqual(cachedChallenge);
    });

    it('should generate local challenge when cache is missing', async () => {
      vi.mocked(storageService.get).mockReturnValue(null);

      const result = await getTodayChallenge({}, mockFlags);
      expect(result.id).toContain('today_challenge_');
      expect(storageService.set).toHaveBeenCalled();
    });

    it('should generate same challenge for same date', async () => {
      vi.mocked(storageService.get).mockReturnValue(null);

      const result1 = await getTodayChallenge({}, mockFlags);
      const result2 = await getTodayChallenge({}, mockFlags);

      expect(result1.id).toBe(result2.id);
      expect(result1.categoryId).toBe(result2.categoryId);
    });
  });
});
