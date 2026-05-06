import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetAllData } from '../dataReset';
import { storageService } from '../../services';

// Mock dependencies
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
    vi.resetAllMocks(); // Use resetAllMocks to clear implementations too
    vi.mocked(storageService.clear).mockImplementation(() => {});
  });

  describe('resetAllData', () => {
    it('should reset all data successfully', async () => {
      const mockClearProfile = vi.fn();
      const mockResetProgress = vi.fn(() => Promise.resolve());

      await resetAllData(mockClearProfile, mockResetProgress);

      expect(storageService.clear).toHaveBeenCalled();
      expect(mockClearProfile).toHaveBeenCalled();
      expect(mockResetProgress).toHaveBeenCalled();
    });

    it('should throw error if storage.clearAppData throws error', async () => {
      const mockClearProfile = vi.fn();
      const mockResetProgress = vi.fn(() => Promise.resolve());

      vi.mocked(storageService.clear).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // storage 에러가 발생하면 전체 함수가 실패해야 함
      await expect(resetAllData(mockClearProfile, mockResetProgress)).rejects.toThrow(
        'Storage error'
      );
    });

    it('should throw error if clearProfile throws error', async () => {
      const mockClearProfile = vi.fn(() => {
        throw new Error('Clear profile error');
      });
      const mockResetProgress = vi.fn(() => Promise.resolve());

      // clearProfile 에러가 발생하면 전체 함수가 실패해야 함
      await expect(resetAllData(mockClearProfile, mockResetProgress)).rejects.toThrow(
        'Clear profile error'
      );
    });

    it('should throw error if resetProgress fails', async () => {
      const mockClearProfile = vi.fn();
      const resetError = new Error('Reset progress error');
      const mockResetProgress = vi.fn(() => Promise.reject(resetError));

      // resetProgress 에러는 throw되어야 함
      await expect(resetAllData(mockClearProfile, mockResetProgress)).rejects.toThrow(
        'Reset progress error'
      );
    });
  });
});
