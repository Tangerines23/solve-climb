import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dumpState, logNetworkRequest, logNetworkResponse, dumpLocalStorage } from '../debug';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    group: vi.fn((_category, _title, fn) => fn()),
    table: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
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
      logNetworkRequest('GET', 'https://example.com', { headers: { 'Content-Type': 'application/json' } });

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
      // Mock localStorage
      const mockLocalStorage = {
        length: 2,
        key: vi.fn((i: number) => (i === 0 ? 'key1' : 'key2')),
        getItem: vi.fn((key: string) => (key === 'key1' ? 'value1' : 'value2')),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      dumpLocalStorage();

      if (import.meta.env.DEV) {
        expect(logger.group).toHaveBeenCalled();
      }
    });
  });
});

