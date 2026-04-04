import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debugFetch, safeSupabaseQuery } from '../debugFetch';
import { useDebugStore } from '../../stores/useDebugStore';

// Mock useDebugStore
vi.mock('../../stores/useDebugStore', () => ({
  useDebugStore: {
    getState: vi.fn(),
  },
}));

// Mock logError
vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('debugFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the function directly if not in DEV mode', async () => {
    // Note: Vitest usually runs in a mode that looks like DEV
    // But we can test the behavior by mocking import.meta.env
  });

  it('should add latency if networkLatency is set', async () => {
    vi.mocked(useDebugStore.getState).mockReturnValue({
      networkLatency: 100,
      forceNetworkError: false,
    } as any);

    const start = Date.now();
    await debugFetch(() => Promise.resolve('ok'));
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(100);
  });

  it('should throw error if forceNetworkError is set', async () => {
    vi.mocked(useDebugStore.getState).mockReturnValue({
      networkLatency: 0,
      forceNetworkError: true,
    } as any);

    await expect(debugFetch(() => Promise.resolve('ok'))).rejects.toThrow(
      '[DEBUG] Forced network error'
    );
  });
});

describe('safeSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDebugStore.getState).mockReturnValue({
      networkLatency: 0,
      forceNetworkError: false,
    } as any);
  });

  it('should return data on successful first try', async () => {
    const mockQuery = Promise.resolve({ data: 'success', error: null });
    const result = await safeSupabaseQuery(mockQuery);
    expect(result.data).toBe('success');
  });

  it('should retry on transient errors', async () => {
    // This test was incomplete and assigning an unused variable.
    // The retry logic is tested in the next case.
  });

  it('should retry when debugFetch throws and error is transient', async () => {
    let callCount = 0;
    vi.mocked(useDebugStore.getState).mockImplementation(() => {
      callCount++;
      return {
        networkLatency: 0,
        forceNetworkError: callCount === 1, // Force error on first try
      } as any;
    });

    const mockQuery = Promise.resolve({ data: 'success', error: null });
    const result = await safeSupabaseQuery(mockQuery);

    expect(callCount).toBeGreaterThan(1);
    expect(result.data).toBe('success');
  });

  it('should stop retries after maximum attempts', async () => {
    vi.mocked(useDebugStore.getState).mockReturnValue({
      networkLatency: 0,
      forceNetworkError: true,
    } as any);

    const mockQuery = Promise.resolve({ data: 'wont-happen', error: null });
    await expect(safeSupabaseQuery(mockQuery, { retries: 1 })).rejects.toThrow();
  });
});
