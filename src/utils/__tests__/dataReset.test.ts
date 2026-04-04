import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetAllData } from '../dataReset';
import { supabase } from '../supabaseClient';
import { useProfileStore } from '../../stores/useProfileStore';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { storageService } from '../../services';

// Mock dependencies
// Mock dependencies (Supabase logic removed from resetAllData)
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: {
    getState: vi.fn(() => ({
      clearProfile: vi.fn(),
    })),
  },
}));

vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: {
    getState: vi.fn(() => ({
      resetProgress: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    clear: vi.fn(),
  },
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('dataReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resetAllData', () => {
    it('should reset all data successfully', async () => {
      const mockClearProfile = vi.fn();
      const mockResetProgress = vi.fn(() => Promise.resolve());
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        resetProgress: mockResetProgress,
      } as never);

      await resetAllData();

      expect(storageService.clear).toHaveBeenCalled();
      expect(mockClearProfile).toHaveBeenCalled();
      expect(mockResetProgress).toHaveBeenCalled();
    });

    it('should handle missing user gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await resetAllData();

      expect(storageService.clear).toHaveBeenCalled();
    });

    it('should handle Supabase getUser error gracefully', async () => {
      const mockClearProfile = vi.fn();
      const mockResetProgress = vi.fn(() => Promise.resolve());

      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Auth error'));
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        resetProgress: mockResetProgress,
      } as never);

      // 에러가 발생해도 계속 진행되어야 함
      await resetAllData();

      expect(storageService.clear).toHaveBeenCalled();
      expect(mockClearProfile).toHaveBeenCalled();
      expect(mockResetProgress).toHaveBeenCalled();
    });

    it('should handle Supabase delete error gracefully', async () => {
      const mockClearProfile = vi.fn();
      const mockResetProgress = vi.fn(() => Promise.resolve());
      const deleteError = { message: 'Delete failed' };
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: deleteError })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        resetProgress: mockResetProgress,
      } as never);

      // delete 에러가 발생해도 계속 진행되어야 함
      await resetAllData();

      expect(storageService.clear).toHaveBeenCalled();
      expect(mockClearProfile).toHaveBeenCalled();
      expect(mockResetProgress).toHaveBeenCalled();
    });

    it('should throw error if storage.clearAppData throws error', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);
      vi.mocked(storageService.clear).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // storage 에러가 발생하면 전체 함수가 실패해야 함
      await expect(resetAllData()).rejects.toThrow('Storage error');
    });

    it('should throw error if clearProfile throws error', async () => {
      const mockClearProfile = vi.fn(() => {
        throw new Error('Clear profile error');
      });
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      // storageService.clear는 정상 동작
      vi.mocked(storageService.clear).mockImplementation(() => {});

      // clearProfile 에러가 발생하면 전체 함수가 실패해야 함
      await expect(resetAllData()).rejects.toThrow('Clear profile error');
    });

    it('should throw error if resetProgress fails', async () => {
      const mockClearProfile = vi.fn();
      const resetError = new Error('Reset progress error');
      const mockResetProgress = vi.fn(() => Promise.reject(resetError));
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as never);
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      vi.mocked(useLevelProgressStore.getState).mockReturnValue({
        resetProgress: mockResetProgress,
      } as never);
      // storageService.clear는 정상 동작
      vi.mocked(storageService.clear).mockImplementation(() => {});

      // resetProgress 에러는 throw되어야 함
      await expect(resetAllData()).rejects.toThrow('Reset progress error');
    });

    it('should handle Supabase errors but throw on storage errors', async () => {
      const mockClearProfile = vi.fn();
      const deleteError = { message: 'Delete failed' };
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: deleteError })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as never);
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Auth error'));
      vi.mocked(useProfileStore.getState).mockReturnValue({
        clearProfile: mockClearProfile,
      } as never);
      vi.mocked(storageService.clear).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Supabase 에러는 무시되지만 storage 에러는 throw되어야 함
      await expect(resetAllData()).rejects.toThrow('Storage error');
    });
  });
});
