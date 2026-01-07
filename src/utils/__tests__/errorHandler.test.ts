import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserErrorMessage, logError, logWarning } from '../errorHandler';
import { useErrorLogStore } from '../stores/useErrorLogStore';

// Mock dependencies
vi.mock('../stores/useErrorLogStore', () => ({
  useErrorLogStore: {
    getState: vi.fn(() => ({
      addLog: vi.fn(),
    })),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserErrorMessage', () => {
    it('should return user-friendly message for network error', () => {
      const error = new TypeError('Network error');
      const message = getUserErrorMessage(error);
      expect(message).toContain('네트워크');
    });

    it('should return user-friendly message for validation error', () => {
      const error = new Error('Validation error');
      const message = getUserErrorMessage(error);
      expect(message).toContain('입력한 정보');
    });

    it('should return user-friendly message for unknown error', () => {
      const error = new Error('Unknown error');
      const message = getUserErrorMessage(error);
      expect(message).toBeTruthy();
    });
  });

  describe('logError', () => {
    it('should log errors', () => {
      const error = new Error('test error');
      logError('test', error);
      expect(useErrorLogStore.getState().addLog).toHaveBeenCalled();
    });
  });

  describe('logWarning', () => {
    it('should log warnings', () => {
      logWarning('test', 'warning message');
      expect(useErrorLogStore.getState().addLog).toHaveBeenCalled();
    });
  });
});
