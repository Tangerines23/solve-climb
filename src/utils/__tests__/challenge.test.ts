import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getTodayChallenge,
  generateTodayChallenge,
  SeededRandom,
  type TodayChallenge,
} from '../challenge';
import { storage } from '../storage';
import { APP_CONFIG } from '../../config/app';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getString: vi.fn(),
    get: vi.fn(),
    setString: vi.fn(),
    set: vi.fn(),
  },
}));

describe('challenge', () => {
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

      const challenge = generateTodayChallenge();
      expect(challenge.topicId).toBe('default');
      expect(challenge.title).toBe('기본 챌린지');

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

      const challenge = generateTodayChallenge();
      expect(challenge.level).toBe(1);
      expect(challenge.title).toContain('도전!');

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
      };

      vi.mocked(storage.getString).mockReturnValue(todayDate);
      vi.mocked(storage.get).mockReturnValue(cachedChallenge);

      const result = await getTodayChallenge();

      expect(result).toEqual(cachedChallenge);
    });

    it('should generate local challenge when cache is missing', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      const result = await getTodayChallenge();
      expect(result.id).toContain('today_challenge_');
      expect(storage.set).toHaveBeenCalled();
    });

    it('should generate same challenge for same date', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      const result1 = await getTodayChallenge();
      const result2 = await getTodayChallenge();

      expect(result1.id).toBe(result2.id);
      expect(result1.categoryId).toBe(result2.categoryId);
    });
  });
});
