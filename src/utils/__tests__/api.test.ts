import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi, gameRecordsApi, statsApi, challengeApi } from '../api';
import { supabase } from '../supabaseClient';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { ENV } from '../env';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../stores/useLoadingStore', () => ({
  useLoadingStore: {
    getState: vi.fn(() => ({
      startLoading: vi.fn(),
      stopLoading: vi.fn(),
    })),
  },
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

vi.mock('../env', () => ({
  ENV: {
    IS_DEVELOPMENT: true,
  },
}));

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authApi', () => {
    describe('getCurrentUser', () => {
      it('should get current user successfully', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
          data: { user: { id: 'test-user' } },
          error: null,
        } as never);

        const user = await authApi.getCurrentUser();

        expect(user).toBeDefined();
        expect(user?.id).toBe('test-user');
      });

      it('should handle errors', async () => {
        vi.mocked(supabase.auth.getUser).mockResolvedValue({
          data: { user: null },
          error: { message: 'Test error' },
        } as never);

        await expect(authApi.getCurrentUser()).rejects.toBeDefined();
      });
    });

    describe('getSession', () => {
      it('should get session successfully', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: { user: { id: 'test-user' } } },
          error: null,
        } as never);

        const session = await authApi.getSession();

        expect(session).toBeDefined();
      });

      it('should return null when no session', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: null },
          error: null,
        } as never);

        const session = await authApi.getSession();

        expect(session).toBeNull();
      });
    });

    describe('signOut', () => {
      it('should sign out successfully', async () => {
        vi.mocked(supabase.auth.signOut).mockResolvedValue({
          error: null,
        } as never);

        await authApi.signOut();

        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });

    describe('onAuthStateChange', () => {
      it('should register auth state change listener', () => {
        const callback = vi.fn();
        const mockUnsubscribe = vi.fn();
        const mockSubscription = { unsubscribe: mockUnsubscribe };
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
          data: { subscription: mockSubscription },
        } as never);

        const unsubscribe = authApi.onAuthStateChange(callback);

        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockSubscription);
      });
    });
  });

  describe('gameRecordsApi', () => {
    describe('getRecords', () => {
      it('should get records successfully', async () => {
        const mockRecords = [
          { score: 100, cleared: true, level: 1, subject: 'math' },
          { score: 200, cleared: false, level: 2, subject: 'language' },
        ];
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const records = await gameRecordsApi.getRecords('user-123');

        expect(supabase.from).toHaveBeenCalledWith('game_records');
        expect(mockSelect).toHaveBeenCalledWith('score, cleared, level, subject');
        expect(records).toEqual(mockRecords);
      });

      it('should return empty array when no records', async () => {
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const records = await gameRecordsApi.getRecords('user-123');

        expect(records).toEqual([]);
      });

      it('should handle errors', async () => {
        const error = { message: 'Query failed' };
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        await expect(gameRecordsApi.getRecords('user-123')).rejects.toEqual(error);
      });
    });

    describe('upsertRecord', () => {
      it('should upsert record successfully', async () => {
        const mockRecord = {
          user_id: 'user-123',
          category: 'math',
          subject: 'arithmetic',
          level: 1,
          mode: 'time-attack',
          score: 100,
          cleared: true,
        };
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });

        vi.mocked(supabase.from).mockReturnValue({
          upsert: mockUpsert,
        } as never);

        await gameRecordsApi.upsertRecord(mockRecord);

        expect(supabase.from).toHaveBeenCalledWith('game_records');
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockRecord,
            updated_at: expect.any(String),
          }),
          {
            onConflict: 'user_id, category, subject, level, mode',
            ignoreDuplicates: false,
          }
        );
      });

      it('should handle errors', async () => {
        const error = { message: 'Upsert failed' };
        const mockRecord = {
          user_id: 'user-123',
          category: 'math',
          subject: 'arithmetic',
          level: 1,
          mode: 'time-attack',
          score: 100,
          cleared: true,
        };
        const mockUpsert = vi.fn().mockResolvedValue({ error });

        vi.mocked(supabase.from).mockReturnValue({
          upsert: mockUpsert,
        } as never);

        await expect(gameRecordsApi.upsertRecord(mockRecord)).rejects.toEqual(error);
      });
    });

    describe('deleteAllRecords', () => {
      it('should delete all records successfully', async () => {
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          delete: mockDelete,
        } as never);

        await gameRecordsApi.deleteAllRecords('user-123');

        expect(supabase.from).toHaveBeenCalledWith('game_records');
        expect(mockDelete).toHaveBeenCalled();
      });

      it('should handle errors', async () => {
        const error = { message: 'Delete failed' };
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          delete: mockDelete,
        } as never);

        await expect(gameRecordsApi.deleteAllRecords('user-123')).rejects.toEqual(error);
      });
    });
  });

  describe('statsApi', () => {
    describe('getUserStatsRPC', () => {
      it('should get user stats from RPC successfully', async () => {
        const mockRpcData = [
          {
            total_height: 1000,
            total_solved: 5,
            max_level: 3,
            best_subject: 'math',
          },
        ];

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockRpcData,
          error: null,
        } as never);

        const stats = await statsApi.getUserStatsRPC();

        expect(supabase.rpc).toHaveBeenCalledWith('get_user_game_stats');
        expect(stats).toEqual({
          totalHeight: 1000,
          totalSolved: 5,
          maxLevel: 3,
          bestSubject: 'math',
        });
      });

      it('should return null when data is empty', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: [],
          error: null,
        } as never);

        const stats = await statsApi.getUserStatsRPC();

        expect(stats).toBeNull();
      });

      it('should return null when data is null', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error: null,
        } as never);

        const stats = await statsApi.getUserStatsRPC();

        expect(stats).toBeNull();
      });

      it('should return null when RPC error occurs', async () => {
        const error = { message: 'RPC failed' };
        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error,
        } as never);

        const stats = await statsApi.getUserStatsRPC();

        expect(stats).toBeNull();
      });

      it('should handle missing fields with defaults', async () => {
        const mockRpcData = [
          {
            total_height: null,
            total_solved: null,
            max_level: null,
            best_subject: null,
          },
        ];

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockRpcData,
          error: null,
        } as never);

        const stats = await statsApi.getUserStatsRPC();

        expect(stats).toEqual({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
      });
    });

    describe('getUserStatsFromRecords', () => {
      it('should calculate stats from records successfully', async () => {
        const mockRecords = [
          { score: 100, cleared: true, level: 1, subject: 'math' },
          { score: 200, cleared: true, level: 3, subject: 'math' },
          { score: 150, cleared: false, level: 2, subject: 'language' },
          { score: 50, cleared: true, level: 1, subject: 'language' },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 500, // 100 + 200 + 150 + 50
          totalSolved: 3, // cleared: true인 것들
          maxLevel: 3, // 최대 레벨
          bestSubject: 'math', // math: 300, language: 200
        });
      });

      it('should return default stats when no records', async () => {
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
      });

      it('should handle records with null values', async () => {
        const mockRecords = [
          { score: null, cleared: true, level: null, subject: null },
          { score: 100, cleared: true, level: 1, subject: 'math' },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 100, // null은 0으로 처리
          totalSolved: 2,
          maxLevel: 1,
          bestSubject: 'math',
        });
      });

      it('should return null bestSubject when all records have null subject', async () => {
        const mockRecords = [
          { score: 100, cleared: true, level: 1, subject: null },
          { score: 200, cleared: true, level: 2, subject: null },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 300,
          totalSolved: 2,
          maxLevel: 2,
          bestSubject: null, // subject가 모두 null이면 null
        });
      });

      it('should return null bestSubject when subjectScores is empty', async () => {
        const mockRecords = [
          { score: 100, cleared: false, level: 1, subject: null },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 100,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
      });

      it('should return maxLevel 0 when solvedRecords is empty', async () => {
        const mockRecords = [
          { score: 100, cleared: false, level: 5, subject: 'math' },
          { score: 200, cleared: false, level: 10, subject: 'language' },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 300,
          totalSolved: 0,
          maxLevel: 0, // cleared가 false이면 0
          bestSubject: 'language', // language: 200, math: 100 -> language가 더 높음
        });
      });

      it('should handle records with no cleared records', async () => {
        const mockRecords = [
          { score: 100, cleared: false, level: 1, subject: 'math' },
          { score: 200, cleared: false, level: 2, subject: 'language' },
        ];

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStatsFromRecords('user-123');

        expect(stats).toEqual({
          totalHeight: 300,
          totalSolved: 0,
          maxLevel: 0, // cleared가 없으면 0
          bestSubject: 'language', // language: 200, math: 100
        });
      });

      it('should handle errors', async () => {
        const error = { message: 'Query failed' };
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        await expect(statsApi.getUserStatsFromRecords('user-123')).rejects.toEqual(error);
      });
    });

    describe('getUserStats', () => {
      it('should return default stats for local session', async () => {
        const stats = await statsApi.getUserStats('user_local_123');

        expect(stats).toEqual({
          totalHeight: 0,
          totalSolved: 0,
          maxLevel: 0,
          bestSubject: null,
        });
        expect(supabase.rpc).not.toHaveBeenCalled();
      });

      it('should return RPC stats when available', async () => {
        const mockRpcData = [
          {
            total_height: 1000,
            total_solved: 5,
            max_level: 3,
            best_subject: 'math',
          },
        ];

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: mockRpcData,
          error: null,
        } as never);

        const stats = await statsApi.getUserStats('real-user-123');

        expect(stats).toEqual({
          totalHeight: 1000,
          totalSolved: 5,
          maxLevel: 3,
          bestSubject: 'math',
        });
      });

      it('should fallback to records when RPC returns null', async () => {
        const mockRecords = [
          { score: 100, cleared: true, level: 1, subject: 'math' },
        ];

        vi.mocked(supabase.rpc).mockResolvedValue({
          data: null,
          error: null,
        } as never);

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const stats = await statsApi.getUserStats('real-user-123');

        expect(stats).toEqual({
          totalHeight: 100,
          totalSolved: 1,
          maxLevel: 1,
          bestSubject: 'math',
        });
      });
    });
  });

  describe('challengeApi', () => {
    describe('getTodayChallenge', () => {
      it('should get challenge successfully', async () => {
        const mockChallenge = {
          id: 'challenge-1',
          challenge_date: '2024-01-01',
          category_id: 'math',
          category_name: '수학',
          topic_id: 'arithmetic',
          topic_name: '산술',
          level: 1,
          mode: 'time-attack',
          title: '오늘의 챌린지',
        };

        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockChallenge, error: null });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(supabase.from).toHaveBeenCalledWith('today_challenges');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalled();
        expect(challenge).toEqual(mockChallenge);
      });

      it('should get challenge with specific date', async () => {
        const mockChallenge = {
          id: 'challenge-1',
          challenge_date: '2024-01-15',
          category_id: 'math',
          category_name: '수학',
          topic_id: 'arithmetic',
          topic_name: '산술',
          level: 1,
          mode: 'time-attack',
          title: '오늘의 챌린지',
        };

        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockChallenge, error: null });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge('2024-01-15');

        expect(challenge).toEqual(mockChallenge);
      });

      it('should return null when no challenge (PGRST116)', async () => {
        const error = { code: 'PGRST116', message: 'No rows returned' };
        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(challenge).toBeNull();
      });

      it('should return null when table does not exist (PGRST205)', async () => {
        const error = { code: 'PGRST205', message: 'Table not found' };
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(challenge).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });

      it('should return null when table does not exist (PGRST301)', async () => {
        const error = { code: 'PGRST301', message: 'Table not found' };
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(challenge).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });

      it('should return null and log error for other errors', async () => {
        const error = { code: 'PGRST500', message: 'Server error' };
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(challenge).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });

      it('should return null when exception occurs', async () => {
        const error = new Error('Network error');
        const mockMaybeSingle = vi.fn().mockRejectedValue(error);
        const mockEq = vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        });
        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: mockSelect,
        } as never);

        const challenge = await challengeApi.getTodayChallenge();

        expect(challenge).toBeNull();
      });
    });
  });

  describe('Loading state management', () => {
    it('should call startLoading and stopLoading for authApi.getCurrentUser', async () => {
      const mockStartLoading = vi.fn();
      const mockStopLoading = vi.fn();
      vi.mocked(useLoadingStore.getState).mockReturnValue({
        startLoading: mockStartLoading,
        stopLoading: mockStopLoading,
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);

      await authApi.getCurrentUser();

      expect(mockStartLoading).toHaveBeenCalled();
      expect(mockStopLoading).toHaveBeenCalled();
    });

    it('should call stopLoading even when error occurs', async () => {
      const mockStartLoading = vi.fn();
      const mockStopLoading = vi.fn();
      vi.mocked(useLoadingStore.getState).mockReturnValue({
        startLoading: mockStartLoading,
        stopLoading: mockStopLoading,
      } as any);

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Test error' },
      } as never);

      await expect(authApi.getCurrentUser()).rejects.toBeDefined();

      expect(mockStartLoading).toHaveBeenCalled();
      expect(mockStopLoading).toHaveBeenCalled();
    });
  });

  describe('statsApi - Edge cases', () => {
    it('should handle getUserStatsFromRecords when getRecords fails', async () => {
      const error = { message: 'Query failed' };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(statsApi.getUserStatsFromRecords('user-123')).rejects.toEqual(error);
    });

    it('should handle getUserStats when RPC fails and getRecords also fails', async () => {
      const error = { message: 'Query failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      } as never);

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(statsApi.getUserStats('real-user-123')).rejects.toEqual(error);
    });

    it('should handle getUserStatsFromRecords with zero scores', async () => {
      const mockRecords = [
        { score: 0, cleared: true, level: 1, subject: 'math' },
        { score: 0, cleared: false, level: 2, subject: 'language' },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const stats = await statsApi.getUserStatsFromRecords('user-123');

      expect(stats).toEqual({
        totalHeight: 0,
        totalSolved: 1,
        maxLevel: 1,
        bestSubject: 'math', // math has cleared record
      });
    });

    it('should handle getUserStatsFromRecords with same subject scores', async () => {
      const mockRecords = [
        { score: 100, cleared: true, level: 1, subject: 'math' },
        { score: 100, cleared: true, level: 2, subject: 'math' },
        { score: 100, cleared: true, level: 1, subject: 'language' },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const stats = await statsApi.getUserStatsFromRecords('user-123');

      // 첫 번째로 정렬된 과목이 선택됨 (정렬 순서에 따라)
      expect(stats.bestSubject).toBeDefined();
      expect(['math', 'language']).toContain(stats.bestSubject);
      expect(stats.totalHeight).toBe(300);
    });

    it('should handle getUserStatsFromRecords with records without subject', async () => {
      const mockRecords = [
        { score: 100, cleared: true, level: 1, subject: null },
        { score: 200, cleared: true, level: 2, subject: 'math' },
        { score: 150, cleared: false, level: 1, subject: null },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const stats = await statsApi.getUserStatsFromRecords('user-123');

      expect(stats).toEqual({
        totalHeight: 450, // 100 + 200 + 150
        totalSolved: 2, // cleared: true인 것들
        maxLevel: 2,
        bestSubject: 'math', // subject가 있는 것만 계산
      });
    });

    it('should handle getUserStatsFromRecords with all records having null subject', async () => {
      const mockRecords = [
        { score: 100, cleared: true, level: 1, subject: null },
        { score: 200, cleared: true, level: 2, subject: null },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const stats = await statsApi.getUserStatsFromRecords('user-123');

      expect(stats).toEqual({
        totalHeight: 300,
        totalSolved: 2,
        maxLevel: 2,
        bestSubject: null, // subject가 모두 null이면 null
      });
    });

    it('should handle getUserStatsRPC when error is thrown', async () => {
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'));

      const stats = await statsApi.getUserStatsRPC();

      expect(stats).toBeNull();
    });

    it('should handle getUserStats when userId starts with user_', async () => {
      const stats = await statsApi.getUserStats('user_local_123');

      expect(stats).toEqual({
        totalHeight: 0,
        totalSolved: 0,
        maxLevel: 0,
        bestSubject: null,
      });
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle getUserStats when userId does not start with user_', async () => {
      const mockRpcData = [
        {
          total_height: 1000,
          total_solved: 5,
          max_level: 3,
          best_subject: 'math',
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockRpcData,
        error: null,
      } as never);

      const stats = await statsApi.getUserStats('real-user-123');

      expect(stats).toEqual({
        totalHeight: 1000,
        totalSolved: 5,
        maxLevel: 3,
        bestSubject: 'math',
      });
    });

    it('should handle getUserStatsRPC when data is empty array', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as never);

      const stats = await statsApi.getUserStatsRPC();

      expect(stats).toBeNull();
    });

    it('should handle getUserStatsRPC when data has null values', async () => {
      const mockRpcData = [
        {
          total_height: null,
          total_solved: null,
          max_level: null,
          best_subject: null,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockRpcData,
        error: null,
      } as never);

      const stats = await statsApi.getUserStatsRPC();

      expect(stats).toEqual({
        totalHeight: 0,
        totalSolved: 0,
        maxLevel: 0,
        bestSubject: null,
      });
    });
  });

  describe('challengeApi - Additional branches', () => {
    it('should use provided date parameter', async () => {
      const mockChallenge = {
        id: 'challenge-1',
        challenge_date: '2024-12-25',
        category_id: 'math',
        category_name: '수학',
        topic_id: 'arithmetic',
        topic_name: '산술',
        level: 1,
        mode: 'time-attack',
        title: '크리스마스 챌린지',
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockChallenge, error: null });
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const challenge = await challengeApi.getTodayChallenge('2024-12-25');

      expect(mockEq).toHaveBeenCalledWith('challenge_date', '2024-12-25');
      expect(challenge).toEqual(mockChallenge);
    });

    it('should use current date when date parameter is not provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockChallenge = {
        id: 'challenge-1',
        challenge_date: today,
        category_id: 'math',
        category_name: '수학',
        topic_id: 'arithmetic',
        topic_name: '산술',
        level: 1,
        mode: 'time-attack',
        title: '오늘의 챌린지',
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockChallenge, error: null });
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const challenge = await challengeApi.getTodayChallenge();

      expect(mockEq).toHaveBeenCalledWith('challenge_date', today);
      expect(challenge).toEqual(mockChallenge);
    });

    it('should handle ENV.IS_DEVELOPMENT false for PGRST205', async () => {
      vi.mocked(ENV).IS_DEVELOPMENT = false;
      const error = { code: 'PGRST205', message: 'Table not found' };
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const challenge = await challengeApi.getTodayChallenge();

      expect(challenge).toBeNull();
      vi.mocked(ENV).IS_DEVELOPMENT = true;
    });

    it('should handle ENV.IS_DEVELOPMENT false for PGRST301', async () => {
      vi.mocked(ENV).IS_DEVELOPMENT = false;
      const error = { code: 'PGRST301', message: 'Table not found' };
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const challenge = await challengeApi.getTodayChallenge();

      expect(challenge).toBeNull();
      vi.mocked(ENV).IS_DEVELOPMENT = true;
    });

    it('should handle ENV.IS_DEVELOPMENT false for other errors', async () => {
      vi.mocked(ENV).IS_DEVELOPMENT = false;
      const error = { code: 'PGRST500', message: 'Server error' };
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error });
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const challenge = await challengeApi.getTodayChallenge();

      expect(challenge).toBeNull();
      vi.mocked(ENV).IS_DEVELOPMENT = true;
    });
  });
});

