import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTodayChallenge, type TodayChallenge } from '../challenge';
import { storage } from '../storage';

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
    // Mock Date to return a fixed date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
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
      expect(storage.getString).toHaveBeenCalledWith('solve-climb-today-challenge-date', null);
      expect(storage.get).toHaveBeenCalledWith('solve-climb-today-challenge', null);
    });

    it('should generate local challenge when cache is missing', async () => {
      const todayDate = '2024-01-15';

      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      const result = await getTodayChallenge();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('categoryId');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('topicId');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('level');
      expect(result.id).toContain('today_challenge_');

      // Verify it was stored
      expect(storage.setString).toHaveBeenCalledWith('solve-climb-today-challenge-date', todayDate);
      expect(storage.set).toHaveBeenCalled();
    });

    it('should generate same challenge for same date (seeded random)', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      const result1 = await getTodayChallenge();
      const result2 = await getTodayChallenge();

      expect(result1.id).toBe(result2.id);
      expect(result1.categoryId).toBe(result2.categoryId);
      expect(result1.topicId).toBe(result2.topicId);
      expect(result1.level).toBe(result2.level);
    });

    it('should generate different challenge for different date', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      // First date
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const result1 = await getTodayChallenge();

      // Second date
      vi.setSystemTime(new Date('2024-01-16T10:00:00Z'));
      const result2 = await getTodayChallenge();

      expect(result1.id).not.toBe(result2.id);
    });

    it('should regenerate challenge if cache date is old', async () => {
      const oldDate = '2024-01-14';
      const todayDate = '2024-01-15';
      const oldChallenge: TodayChallenge = {
        id: `today_challenge_${oldDate}`,
        title: 'Old Challenge',
        category: '수학',
        categoryId: 'math',
        topic: '덧셈',
        topicId: 'addition',
        mode: 'time-attack',
        level: 1,
      };

      vi.mocked(storage.getString).mockReturnValue(oldDate);
      vi.mocked(storage.get).mockReturnValue(oldChallenge);

      const result = await getTodayChallenge();

      expect(result.id).toContain(`today_challenge_${todayDate}`);
      expect(result.id).not.toBe(oldChallenge.id);

      // confirm new save
      expect(storage.setString).toHaveBeenCalledWith('solve-climb-today-challenge-date', todayDate);
    });
  });

  describe('Challenge data validation', () => {
    it('should generate valid fields', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);

      const result = await getTodayChallenge();

      expect(result.level).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(result.level)).toBe(true);
      expect(result.mode).toBe('time-attack');
      expect(result.title).toBeTruthy();
    });
  });
});
