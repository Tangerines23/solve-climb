import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDebugLog } from '../debugLogger';

// Mock fetch
global.fetch = vi.fn();

describe('debugLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendDebugLog', () => {
    it('should be callable without errors', () => {
      // Just verify the function can be called
      expect(() => {
        sendDebugLog('test', 'Test message', { data: 'test' });
      }).not.toThrow();
    });

    it('should handle missing debug URL gracefully', () => {
      // Function should not throw even if URL is not set
      expect(() => {
        sendDebugLog('test', 'Test message');
      }).not.toThrow();
    });
  });
});

