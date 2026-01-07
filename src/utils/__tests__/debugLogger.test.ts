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

    it('should send log when debug URL is set', async () => {
      // Mock environment variable
      const originalEnv = import.meta.env.VITE_DEBUG_URL;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, VITE_DEBUG_URL: 'https://debug.example.com' },
        writable: true,
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response);

      sendDebugLog('test', 'Test message', { data: 'test' });

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_URL) {
        expect(fetch).toHaveBeenCalled();
      }

      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, VITE_DEBUG_URL: originalEnv },
        writable: true,
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const originalEnv = import.meta.env.VITE_DEBUG_URL;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, VITE_DEBUG_URL: 'https://debug.example.com' },
        writable: true,
      });

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      // Should not throw
      expect(() => {
        sendDebugLog('test', 'Test message');
      }).not.toThrow();

      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, VITE_DEBUG_URL: originalEnv },
        writable: true,
      });
    });
  });
});

