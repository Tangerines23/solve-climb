import { describe, it, expect } from 'vitest';
import {
  getHeatmapIntensity,
  getThemeScoreMultiplier,
  getLevelBadgeName,
  buildHeatmapData,
  calculateStreakFromActivityMap,
  getEmptyStats,
  calculateLocalStats,
  calculateAuthenticatedStats,
} from '../historyStatsCalculator';

describe('historyStatsCalculator', () => {
  describe('getHeatmapIntensity', () => {
    it('should return 0 for count 0', () => {
      expect(getHeatmapIntensity(0)).toBe(0);
    });

    it('should return 1 for count 1', () => {
      expect(getHeatmapIntensity(1)).toBe(1);
    });

    it('should return 2 for count 3', () => {
      expect(getHeatmapIntensity(3)).toBe(2);
    });

    it('should return 3 for count 6', () => {
      expect(getHeatmapIntensity(6)).toBe(3);
    });

    it('should return 4 for count 11', () => {
      expect(getHeatmapIntensity(11)).toBe(4);
    });
  });

  describe('getThemeScoreMultiplier', () => {
    it('should return 3.0 for math_calculus', () => {
      expect(getThemeScoreMultiplier('math_calculus')).toBe(3.0);
    });

    it('should return 1.0 for math_arithmetic', () => {
      expect(getThemeScoreMultiplier('math_arithmetic')).toBe(1.0);
    });

    it('should return 1.0 for lang_japanese', () => {
      expect(getThemeScoreMultiplier('lang_japanese')).toBe(1.0);
    });

    it('should return 1.5 for math_geometry', () => {
      expect(getThemeScoreMultiplier('math_geometry')).toBe(1.5);
    });
  });

  describe('getLevelBadgeName', () => {
    it('should return Beginner for level 1', () => {
      expect(getLevelBadgeName(1)).toBe('Beginner');
    });

    it('should return Intermediate for level 5', () => {
      expect(getLevelBadgeName(5)).toBe('Intermediate');
    });

    it('should return Expert for level 10', () => {
      expect(getLevelBadgeName(10)).toBe('Expert');
    });
  });

  describe('buildHeatmapData', () => {
    it('should build 28 days of data with correct intensity mapping', () => {
      const activityMap = new Map<string, number>();
      const todayStart = new Date('2023-01-01');

      // Add activity for 3 days
      activityMap.set('Sun Dec 25 2022', 1);
      activityMap.set('Mon Dec 26 2022', 3);
      activityMap.set('Tue Dec 27 2022', 11);

      const result = buildHeatmapData(activityMap, todayStart);

      expect(result).toHaveLength(28);
      expect(result[20]).toEqual({ date: 'Sun Dec 25 2022', count: 1, intensity: 1 });
      expect(result[21]).toEqual({ date: 'Mon Dec 26 2022', count: 3, intensity: 2 });
      expect(result[22]).toEqual({ date: 'Tue Dec 27 2022', count: 11, intensity: 4 });
    });
  });

  describe('calculateStreakFromActivityMap', () => {
    it('should calculate streak when played today and yesterday', () => {
      const activityMap = new Map<string, number>();
      const todayStart = new Date('2023-01-01');

      activityMap.set('Sun Jan 01 2023', 1);
      activityMap.set('Sat Dec 31 2022', 1);

      const result = calculateStreakFromActivityMap(activityMap, todayStart);
      expect(result).toBe(2);
    });

    it('should calculate streak when played yesterday and day before but not today', () => {
      const activityMap = new Map<string, number>();
      const todayStart = new Date('2023-01-01');

      activityMap.set('Sat Dec 31 2022', 1);
      activityMap.set('Fri Dec 30 2022', 1);

      const result = calculateStreakFromActivityMap(activityMap, todayStart);
      expect(result).toBe(2);
    });

    it('should return 0 when no activity', () => {
      const activityMap = new Map<string, number>();
      const todayStart = new Date('2023-01-01');

      const result = calculateStreakFromActivityMap(activityMap, todayStart);
      expect(result).toBe(0);
    });
  });

  describe('getEmptyStats', () => {
    it('should return empty stats with given title', () => {
      const result = getEmptyStats('익명 등반가');
      expect(result.userTitle).toBe('익명 등반가');
      expect(result.weeklyTotal).toBe(0);
      expect(result.totalAltitude).toBe(0);
      expect(result.streakCount).toBe(0);
      expect(result.heatmapData).toHaveLength(0);
      expect(result.smartComment).toBe('등반을 시작해보세요!');
    });
  });

  describe('calculateLocalStats', () => {
    it('should calculate stats correctly with local history records', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const history = [
        {
          score: 100,
          date: today.toISOString(),
          category: 'math',
          world: 'world1',
          level: 5,
          mode: 'normal',
          correctCount: 8,
          total: 10,
        },
        {
          score: 150,
          date: yesterday.toISOString(),
          category: 'lang',
          world: 'world2',
          level: 3,
          mode: 'survival',
          correctCount: 7,
          total: 10,
        },
      ];

      const result = calculateLocalStats(history, '익명 등반가');

      expect(result.totalAltitude).toBe(250);
      expect(result.totalCorrect).toBe(15);
      expect(result.averageAccuracy).toBe(75);
      expect(result.streakCount).toBe(2);
      expect(result.categoryLevels).toHaveLength(2);
      expect(result.allActivities).toHaveLength(2);
    });
  });

  describe('calculateAuthenticatedStats', () => {
    it('should calculate stats correctly with authenticated data', () => {
      const todayIso = new Date().toISOString();
      const params = {
        recordsData: [
          {
            world_id: 'world1',
            category_id: 'math',
            subject_id: 'arithmetic',
            level: 5,
            mode_code: 2,
            best_score: 150,
            updated_at: todayIso,
          },
        ],
        sessionsData: [
          {
            category: 'math',
            subject: 'geometry',
            level: 3,
            game_mode: 'timeattack',
            score: 50,
            created_at: todayIso,
          },
        ],
        profileData: {
          total_mastery_score: 150,
          login_streak: 2,
          last_login_at: todayIso,
        },
      };

      const result = calculateAuthenticatedStats(params);

      expect(result.totalAltitude).toBe(150);
      expect(result.totalCorrect).toBe(5);
      expect(result.averageAccuracy).toBe(50);
      expect(result.streakCount).toBe(2);
      expect(result.categoryLevels).toHaveLength(1);
      expect(result.allActivities).toHaveLength(3);
    });

    it('should fallback to calculated streak when profile streak is 0', () => {
      const todayIso = new Date().toISOString();
      const params = {
        recordsData: [
          {
            world_id: 'world1',
            category_id: 'math',
            subject_id: 'arithmetic',
            level: 5,
            mode_code: 2,
            best_score: 100,
            updated_at: todayIso,
          },
        ],
        sessionsData: [],
        profileData: {
          total_mastery_score: 150,
          login_streak: 0,
          last_login_at: null,
        },
      };

      const result = calculateAuthenticatedStats(params);
      expect(result.streakCount).toBe(1);
    });
  });
});
