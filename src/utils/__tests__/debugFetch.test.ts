import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debugFetch, safeSupabaseQuery, registerDebugConfig } from '../debugFetch';

// Mock logError
vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('debugFetch', () => {
  let mockConfig = {
    networkLatency: 0,
    forceNetworkError: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      networkLatency: 0,
      forceNetworkError: false,
    };
    registerDebugConfig(() => mockConfig);
  });

  it('should add latency if networkLatency is set', async () => {
    mockConfig.networkLatency = 50; // Lower latency for faster test

    const start = Date.now();
    await debugFetch(() => Promise.resolve('ok'));
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(45);
  });

  it('should throw error if forceNetworkError is set', async () => {
    mockConfig.forceNetworkError = true;

    await expect(debugFetch(() => Promise.resolve('ok'))).rejects.toThrow(
      '[DEBUG] Forced network error'
    );
  });
});

describe('safeSupabaseQuery', () => {
  let mockConfig = {
    networkLatency: 0,
    forceNetworkError: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      networkLatency: 0,
      forceNetworkError: false,
    };
    registerDebugConfig(() => mockConfig);
  });

  it('should return data on successful first try', async () => {
    const mockQuery = Promise.resolve({ data: 'success', error: null });
    const result = await safeSupabaseQuery(mockQuery);
    expect(result.data).toBe('success');
  });

  it('should retry when debugFetch throws due to forced error', async () => {
    let callCount = 0;
    registerDebugConfig(() => {
      callCount++;
      return {
        networkLatency: 0,
        forceNetworkError: callCount === 1, // Fail on first attempt
      };
    });

    const mockQuery = Promise.resolve({ data: 'success', error: null });
    // Use 0 retries to test it actually tries at least once more? 
    // Wait, safeSupabaseQuery uses retries parameter.
    const result = await safeSupabaseQuery(mockQuery, { retries: 1 });

    expect(callCount).toBeGreaterThan(1);
    expect(result.data).toBe('success');
  });

  it('should stop retries after maximum attempts', async () => {
    mockConfig.forceNetworkError = true;

    const mockQuery = Promise.resolve({ data: 'wont-happen', error: null });
    // This will take some time due to backoff
    await expect(safeSupabaseQuery(mockQuery, { retries: 1 })).rejects.toThrow();
  });
});
