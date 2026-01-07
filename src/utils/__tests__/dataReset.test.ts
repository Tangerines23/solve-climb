import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetAllData } from '../dataReset';
import { supabase } from '../supabaseClient';
import { useProfileStore } from '../../stores/useProfileStore';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { storage } from '../storage';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
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

vi.mock('../storage', () => ({
  storage: {
    clearAppData: vi.fn(),
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

      expect(storage.clearAppData).toHaveBeenCalled();
      expect(mockClearProfile).toHaveBeenCalled();
      expect(mockResetProgress).toHaveBeenCalled();
    });

    it('should handle missing user gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await resetAllData();

      expect(storage.clearAppData).toHaveBeenCalled();
    });
  });
});

