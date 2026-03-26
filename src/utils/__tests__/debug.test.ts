/// <reference types="vite/client" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dumpState,
  logNetworkRequest,
  logNetworkResponse,
  dumpLocalStorage,
  dumpSessionStorage,
} from '../debug';
import { logger } from '../logger';
import { storageService } from '../../services';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    group: vi.fn((_category, _title, fn) => (fn ? fn() : undefined)),
    table: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    keys: vi.fn(() => []),
    get: vi.fn(),
  },
}));

describe('debug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dumpState', () => {
    it('should dump state in development mode', () => {
      const mockState = { count: 1, name: 'test' };
      dumpState('testState', mockState);

      // In development mode, logger.group should be called
      if (import.meta.env.DEV) {
        expect(logger.group).toHaveBeenCalled();
      }
    });
  });

  describe('logNetworkRequest', () => {
    it('should log network request in development mode', () => {
      logNetworkRequest('GET', 'https://example.com', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });

  describe('logNetworkResponse', () => {
    it('should log network response in development mode', () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response;

      logNetworkResponse('GET', 'https://example.com', mockResponse, 100);

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });

  describe('dumpLocalStorage', () => {
    it('should dump localStorage in development mode', () => {
      // Mock storageService
      vi.mocked(storageService.keys).mockReturnValue(['key1', 'key2']);
      vi.mocked(storageService.get).mockImplementation((key: string) =>
        key === 'key1' ? 'value1' : 'value2'
      );

      dumpLocalStorage();

      if (import.meta.env.DEV) {
        expect(storageService.keys).toHaveBeenCalled();
        expect(storageService.get).toHaveBeenCalledWith('key1');
        expect(storageService.get).toHaveBeenCalledWith('key2');
        expect(logger.group).toHaveBeenCalled();
      }
    });

    it('should handle localStorage errors gracefully', () => {
      vi.mocked(storageService.keys).mockImplementation(() => {
        throw new Error('Storage error');
      });

      dumpLocalStorage();

      // Should not throw, should log error
      if (import.meta.env.DEV) {
        expect(logger.error).toHaveBeenCalled();
      }
    });

    it('should handle empty localStorage', () => {
      vi.mocked(storageService.keys).mockReturnValue([]);

      dumpLocalStorage();

      if (import.meta.env.DEV) {
        expect(storageService.keys).toHaveBeenCalled();
        expect(logger.group).toHaveBeenCalled();
      }
    });
  });

  describe('dumpSessionStorage', () => {
    it('should dump sessionStorage in development mode', () => {
      const mockSessionStorage = {
        length: 2,
        key: vi.fn((i: number) => (i === 0 ? 'key1' : 'key2')),
        getItem: vi.fn((key: string) => (key === 'key1' ? 'value1' : 'value2')),
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
      });

      dumpSessionStorage();

      if (import.meta.env.DEV) {
        expect(logger.group).toHaveBeenCalled();
      }
    });

    it('should handle sessionStorage errors gracefully', () => {
      const mockSessionStorage = {
        length: 1,
        key: vi.fn(() => {
          throw new Error('Storage error');
        }),
        getItem: vi.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
      });

      dumpSessionStorage();

      if (import.meta.env.DEV) {
        expect(logger.error).toHaveBeenCalled();
      }
    });
  });

  describe('dumpState - error handling', () => {
    it('should handle errors when dumping state', () => {
      const circularObj: Record<string, unknown> = {};
      circularObj.self = circularObj;

      // This should not throw
      dumpState('circular', circularObj);

      if (import.meta.env.DEV) {
        // Should either call group or error
        try {
          expect(logger.group).toHaveBeenCalled();
        } catch {
          expect(logger.error).toHaveBeenCalled();
        }
      }
    });
  });

  describe('logNetworkResponse', () => {
    it('should log response without duration', () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      } as Response;

      logNetworkResponse('GET', 'https://example.com', mockResponse);

      if (import.meta.env.DEV) {
        expect(logger.debug).toHaveBeenCalled();
      }
    });
  });
});
