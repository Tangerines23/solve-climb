import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTodayChallenge, type TodayChallenge } from '../challenge';
import { storage } from '../storage';
import { challengeApi } from '../api';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getString: vi.fn(),
    get: vi.fn(),
    setString: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock challengeApi
vi.mock('../api', () => ({
  challengeApi: {
    getTodayChallenge: vi.fn(),
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
        mode: 'time_attack',
        level: 1,
      };

      vi.mocked(storage.getString).mockReturnValue(todayDate);
      vi.mocked(storage.get).mockReturnValue(cachedChallenge);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result = await getTodayChallenge();

      expect(result).toEqual(cachedChallenge);
      expect(storage.getString).toHaveBeenCalledWith('solve-climb-today-challenge-date', null);
      expect(storage.get).toHaveBeenCalledWith('solve-climb-today-challenge', null);
    });

    it('should fetch from server when cache is not available', async () => {
      const todayDate = '2024-01-15';
      const serverChallenge = {
        id: 'server_challenge_1',
        title: 'Server Challenge',
        category_name: '수학',
        category_id: 'math',
        topic_name: '덧셈',
        topic_id: 'addition',
        mode: 'time_attack',
        level: 2,
      };

      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(serverChallenge);

      const result = await getTodayChallenge();

      expect(result).toEqual({
        id: serverChallenge.id,
        title: serverChallenge.title,
        category: serverChallenge.category_name,
        categoryId: serverChallenge.category_id,
        topic: serverChallenge.topic_name,
        topicId: serverChallenge.topic_id,
        mode: serverChallenge.mode,
        level: serverChallenge.level,
      });
      expect(storage.setString).toHaveBeenCalledWith('solve-climb-today-challenge-date', todayDate);
      expect(storage.set).toHaveBeenCalled();
    });

    it('should generate local challenge when server fails', async () => {
      const todayDate = '2024-01-15';

      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockRejectedValue(new Error('Network error'));

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
      expect(storage.setString).toHaveBeenCalledWith('solve-climb-today-challenge-date', todayDate);
      expect(storage.set).toHaveBeenCalled();
    });

    it('should generate local challenge when server returns null', async () => {
      const todayDate = '2024-01-15';

      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

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
    });

    it('should update cache in background when cached challenge exists', async () => {
      const todayDate = '2024-01-15';
      const cachedChallenge: TodayChallenge = {
        id: `today_challenge_${todayDate}`,
        title: 'Cached Challenge',
        category: '수학',
        categoryId: 'math',
        topic: '덧셈',
        topicId: 'addition',
        mode: 'time_attack',
        level: 1,
      };
      const serverChallenge = {
        id: 'server_challenge_1',
        title: 'Server Challenge',
        category_name: '수학',
        category_id: 'math',
        topic_name: '뺄셈',
        topic_id: 'subtraction',
        mode: 'time_attack',
        level: 2,
      };

      vi.mocked(storage.getString).mockReturnValue(todayDate);
      vi.mocked(storage.get).mockReturnValue(cachedChallenge);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(serverChallenge);

      const result = await getTodayChallenge();

      // Should return cached challenge immediately
      expect(result).toEqual(cachedChallenge);

      // Background update is async, so we just verify the API was called
      // The actual update happens in the background promise
      expect(challengeApi.getTodayChallenge).toHaveBeenCalledWith(todayDate);
    }, 10000);

    it('should generate challenge with valid structure', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result = await getTodayChallenge();

      // Validate structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('categoryId');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('topicId');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('level');

      // Validate types
      expect(typeof result.id).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(typeof result.category).toBe('string');
      expect(typeof result.categoryId).toBe('string');
      expect(typeof result.topic).toBe('string');
      expect(typeof result.topicId).toBe('string');
      expect(typeof result.mode).toBe('string');
      expect(typeof result.level).toBe('number');

      // Validate values
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.category.length).toBeGreaterThan(0);
      expect(result.categoryId.length).toBeGreaterThan(0);
      expect(result.topic.length).toBeGreaterThan(0);
      expect(result.topicId.length).toBeGreaterThan(0);
      expect(result.mode).toBe('time_attack');
      expect(result.level).toBeGreaterThanOrEqual(1);
    });

    it('should generate same challenge for same date', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result1 = await getTodayChallenge();
      const result2 = await getTodayChallenge();

      // Same date should generate same challenge (seeded random)
      expect(result1.id).toBe(result2.id);
      expect(result1.categoryId).toBe(result2.categoryId);
      expect(result1.topicId).toBe(result2.topicId);
      expect(result1.level).toBe(result2.level);
    });

    it('should handle different dates correctly', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      // First date
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
      const result1 = await getTodayChallenge();

      // Second date
      vi.setSystemTime(new Date('2024-01-16T10:00:00Z'));
      const result2 = await getTodayChallenge();

      // Different dates should generate different challenges
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('Challenge data validation', () => {
    it('should generate challenge with valid category', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result = await getTodayChallenge();

      // Should be either math or language (based on code)
      expect(['수학', '언어']).toContain(result.category);
      expect(['math', 'language']).toContain(result.categoryId);
    });

    it('should generate challenge with valid mode', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result = await getTodayChallenge();

      expect(result.mode).toBe('time_attack');
    });

    it('should generate challenge with valid level', async () => {
      vi.mocked(storage.getString).mockReturnValue(null);
      vi.mocked(storage.get).mockReturnValue(null);
      vi.mocked(challengeApi.getTodayChallenge).mockResolvedValue(null);

      const result = await getTodayChallenge();

      expect(result.level).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(result.level)).toBe(true);
    });
  });
});

