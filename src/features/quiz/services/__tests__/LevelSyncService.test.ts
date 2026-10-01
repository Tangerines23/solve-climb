import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LevelSyncService,
  mapCategoryAndSubject,
  mapGameMode,
  generateSessionUUID,
} from '../LevelSyncService';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { useAuthStore } from '@/stores/useAuthStore';

vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn(),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      signInAnonymously: vi.fn(),
    })),
  },
}));

vi.mock('@/utils/errorHandler', () => ({
  logError: vi.fn(),
}));

describe('Pure Helpers', () => {
  describe('mapCategoryAndSubject', () => {
    it('maps arithmetic_addition correctly', () => {
      expect(mapCategoryAndSubject('arithmetic_addition')).toEqual({
        rpcCategory: 'math',
        rpcSubject: 'add',
      });
    });

    it('maps arithmetic_multiplication correctly', () => {
      expect(mapCategoryAndSubject('arithmetic_multiplication')).toEqual({
        rpcCategory: 'math',
        rpcSubject: 'mul',
      });
    });

    it('maps arithmetic_division correctly', () => {
      expect(mapCategoryAndSubject('arithmetic_division')).toEqual({
        rpcCategory: 'math',
        rpcSubject: 'div',
      });
    });

    it('maps arithmetic_subtraction correctly', () => {
      expect(mapCategoryAndSubject('arithmetic_subtraction')).toEqual({
        rpcCategory: 'math',
        rpcSubject: 'sub',
      });
    });

    it('maps cs_data_structures correctly', () => {
      expect(mapCategoryAndSubject('cs_data_structures')).toEqual({
        rpcCategory: 'cs',
        rpcSubject: 'data_structures',
      });
    });

    it('maps science with subject physics correctly', () => {
      expect(mapCategoryAndSubject('science', 'physics')).toEqual({
        rpcCategory: 'science',
        rpcSubject: 'physics',
      });
    });

    it('maps algebra without subject correctly', () => {
      expect(mapCategoryAndSubject('algebra')).toEqual({
        rpcCategory: 'algebra',
        rpcSubject: 'add',
      });
    });
  });

  describe('mapGameMode', () => {
    it('maps time-attack correctly', () => {
      expect(mapGameMode('time-attack')).toBe('timeattack');
    });

    it('maps survival correctly', () => {
      expect(mapGameMode('survival')).toBe('survival');
    });

    it('maps infinite correctly', () => {
      expect(mapGameMode('infinite')).toBe('infinite');
    });
  });

  describe('generateSessionUUID', () => {
    it('returns a non-empty string', () => {
      expect(generateSessionUUID()).toBeTypeOf('string');
      expect(generateSessionUUID().length).toBeGreaterThan(0);
    });
  });
});

describe('LevelSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitGameResult', () => {
    it('returns { success: true } when user is authenticated and RPC succeeds', async () => {
      vi.mocked(safeSupabaseQuery)
        .mockResolvedValueOnce({ data: { user: { id: 'test-user' } }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        sessionData: {
          sessionId: 'session-123',
          answers: [10],
          questionIds: ['q-1'],
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('calls signInAnonymously and succeeds when user is initially not authenticated', async () => {
      const signInMock = vi.fn().mockResolvedValue({});
      vi.mocked(useAuthStore.getState).mockReturnValue({
        signInAnonymously: signInMock,
      } as unknown as ReturnType<typeof useAuthStore.getState>);

      vi.mocked(safeSupabaseQuery)
        .mockResolvedValueOnce({ data: { user: null }, error: null })
        .mockResolvedValueOnce({ data: { user: { id: 'anon-user' } }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        sessionData: {
          sessionId: 'session-123',
          answers: [10],
          questionIds: ['q-1'],
        },
      });

      expect(signInMock).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('returns { success: false, error: "No user found" } when signInAnonymously fails to provide user', async () => {
      const signInMock = vi.fn().mockRejectedValue(new Error('Auth failed'));
      vi.mocked(useAuthStore.getState).mockReturnValue({
        signInAnonymously: signInMock,
      } as unknown as ReturnType<typeof useAuthStore.getState>);

      vi.mocked(safeSupabaseQuery).mockResolvedValue({ data: { user: null }, error: null });

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
      });

      expect(result).toEqual({ success: false, error: 'No user found' });
    });

    it('creates a fallback session when sessionData is not provided', async () => {
      vi.mocked(safeSupabaseQuery)
        .mockResolvedValueOnce({ data: { user: { id: 'test-user' } }, error: null })
        .mockResolvedValueOnce({ data: { session_id: 'fallback-session-id' }, error: null })
        .mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
      });

      expect(result).toEqual({ success: true });
    });

    it('returns { success: false, error: "..." } when submit_game_result RPC fails', async () => {
      vi.mocked(safeSupabaseQuery)
        .mockResolvedValueOnce({ data: { user: { id: 'test-user' } }, error: null })
        .mockResolvedValueOnce({
          data: { success: false, error: 'RPC custom validation failed' },
          error: null,
        });

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
        sessionData: {
          sessionId: 'session-123',
          answers: [10],
          questionIds: ['q-1'],
        },
      });

      expect(result).toEqual({ success: false, error: 'RPC custom validation failed' });
    });

    it('catches and returns { success: false, error: "..." } when an unexpected error is thrown', async () => {
      vi.mocked(safeSupabaseQuery).mockRejectedValueOnce(new Error('Network crash'));

      const result = await LevelSyncService.submitGameResult({
        category: 'arithmetic_addition',
        level: 1,
        mode: 'time-attack',
        score: 100,
      });

      expect(result).toEqual({ success: false, error: 'Network crash' });
    });
  });

  describe('resetProgress', () => {
    it('returns { success: true } when secure_reset_progress succeeds', async () => {
      vi.mocked(safeSupabaseQuery).mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await LevelSyncService.resetProgress();
      expect(result).toEqual({ success: true });
    });

    it('falls back to reset_user_progress when secure_reset_progress fails with PGRST202', async () => {
      vi.mocked(safeSupabaseQuery)
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST202' } })
        .mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await LevelSyncService.resetProgress();
      expect(result).toEqual({ success: true });
    });

    it('returns { success: false, error: "..." } when reset RPC fails', async () => {
      vi.mocked(safeSupabaseQuery).mockResolvedValueOnce({
        data: null,
        error: { message: 'Reset permission denied' },
      });

      const result = await LevelSyncService.resetProgress();
      expect(result).toEqual({ success: false, error: 'Reset permission denied' });
    });
  });
});
